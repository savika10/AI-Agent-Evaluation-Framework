import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
import { createClient } from '@supabase/supabase-js';
import { faker } from '@faker-js/faker';

// --- Configuration ---
const TEST_USER_ID = '476b56c5-d886-4896-a5e0-ab0b56a5b3dd'; 
const NUM_EVALS_TO_GENERATE = 20000;
const DAYS_IN_HISTORY = 30;
const BATCH_SIZE = 1000; 

// Initialize Supabase Client using the Service Role Key for elevated permissions
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY! 
);

function generateSingleEval(userId: string) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - DAYS_IN_HISTORY);

    const score = faker.number.float({ min: 0.5, max: 1.0, fractionDigits: 2});
    const latency = faker.number.int({ min: 50, max: 2000 }); // 50ms to 2000ms
    const flags = faker.helpers.arrayElements(['safe', 'low_confidence', 'hallucination', 'safety_violation', 'pii_found'], { min: 0, max: 2 });
    const piiRedacted = flags.includes('pii_found') ? faker.number.int({ min: 1, max: 10 }) : 0;

    return {
        user_id: userId,
        interaction_id: faker.string.uuid(),
        prompt: faker.lorem.paragraph(),
        response: faker.lorem.sentences(3),
        score: score,
        latency_ms: latency,
        flags: flags,
        pii_tokens_redacted: piiRedacted,
        created_at: faker.date.between({ from: startDate, to: new Date() }).toISOString(),
    };
}

async function seedEvaluations(userId: string) {

    console.log(`Starting seed process for User ID: ${userId} (${NUM_EVALS_TO_GENERATE} rows)...`);

    // Ensure the config exists for the user
    const { error: configError } = await supabase
        .from('evaluation_configs')
        .upsert({ user_id: userId }, { onConflict: 'user_id' });

    if (configError) {
        console.error("Failed to ensure evaluation_configs row exists:", configError);
        return;
    }

    for (let i = 0; i < NUM_EVALS_TO_GENERATE; i += BATCH_SIZE) {
        const batch = [];
        for (let j = 0; j < BATCH_SIZE && i + j < NUM_EVALS_TO_GENERATE; j++) {
            batch.push(generateSingleEval(userId));
        }

        process.stdout.write(`Inserting batch ${i / BATCH_SIZE + 1}... `);

        const { error } = await supabase.from('evaluations').insert(batch);

        if (error) {
            console.error(`\nBatch failed at index ${i}:`, error);
            return;
        }
        process.stdout.write('Done.\n');
    }

    console.log(`\nSuccessfully seeded ${NUM_EVALS_TO_GENERATE} evaluation records.`);
}

seedEvaluations(TEST_USER_ID);
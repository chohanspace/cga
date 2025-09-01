
import { config } from 'dotenv';
config();

import '@/ai/flows/generate-text-from-prompt.ts';
import '@/ai/flows/manage-conversation-context.ts';
import '@/ai/flows/generate-image-from-prompt.ts'; // Added new flow

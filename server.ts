import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GEMINI_MODEL = 'gemini-2.5-flash';

function getAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error('GEMINI_API_KEY is not configured in the server environment.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function handleAIError(res: express.Response, err: unknown) {
  console.error('Gemini API error:', err);
  const message = err instanceof Error ? err.message : 'Unexpected AI service error';
  const status = message.includes('GEMINI_API_KEY')
    ? 503
    : message.includes('429') || message.includes('RESOURCE_EXHAUSTED')
      ? 429
      : 500;
  res.status(status).json({ error: message });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  // 1. AI Event Planner (Structured JSON via responseSchema)
  app.post('/api/ai/plan-event', async (req, res) => {
    try {
      const { prompt } = req.body as { prompt?: string };
      if (!prompt || !prompt.trim()) {
        return res.status(400).json({ error: 'Please provide an event planning prompt.' });
      }

      const ai = getAIClient();
      const today = new Date().toISOString().split('T')[0];

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: `Current date: ${today}. Create a comprehensive, realistic, actionable event plan for the following request: "${prompt.trim()}".
        Return prices in INR (Indian Rupees, numeric integer values; note: 1 lakh = 100000).
        If the user mentions a date like "15 Jan" without a year, choose the next upcoming occurrence after ${today}.
        Select eventType strictly from: wedding, college fest, corporate, birthday, conference.
        Select requiredVendorCategories strictly from: catering, decoration, photography, sound/lighting, venue, makeup, transport.`,
        config: {
          systemInstruction:
            'You are a senior event production director in India. Produce realistic budgets, itemized timelines, practical risk mitigations, and vendor categories tailored to the exact guest count, city, and budget.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              eventName: { type: Type.STRING },
              eventType: {
                type: Type.STRING,
                description: 'One of: wedding, college fest, corporate, birthday, conference',
              },
              date: { type: Type.STRING, description: 'ISO date YYYY-MM-DD' },
              location: { type: Type.STRING },
              guestCount: { type: Type.INTEGER },
              totalBudget: { type: Type.INTEGER, description: 'Numeric total budget in INR' },
              summary: { type: Type.STRING },
              budgetSplit: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    category: { type: Type.STRING },
                    percentage: { type: Type.NUMBER },
                    amount: { type: Type.INTEGER },
                    rationale: { type: Type.STRING },
                  },
                  required: ['category', 'percentage', 'amount', 'rationale'],
                },
              },
              requiredVendorCategories: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              timeline: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    dayLabel: { type: Type.STRING },
                    timeSlot: { type: Type.STRING },
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    owner: { type: Type.STRING },
                  },
                  required: ['dayLabel', 'timeSlot', 'title', 'description', 'owner'],
                },
              },
              riskWarnings: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    severity: { type: Type.STRING, description: 'high, medium, or low' },
                    title: { type: Type.STRING },
                    mitigation: { type: Type.STRING },
                  },
                  required: ['severity', 'title', 'mitigation'],
                },
              },
              checklist: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    category: { type: Type.STRING },
                    dueDaysBeforeEvent: { type: Type.INTEGER },
                    priority: { type: Type.STRING, description: 'high, medium, or low' },
                  },
                  required: ['title', 'category', 'dueDaysBeforeEvent', 'priority'],
                },
              },
            },
            required: [
              'eventName',
              'eventType',
              'date',
              'location',
              'guestCount',
              'totalBudget',
              'summary',
              'budgetSplit',
              'requiredVendorCategories',
              'timeline',
              'riskWarnings',
              'checklist',
            ],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim());
      res.json(parsed);
    } catch (err) {
      handleAIError(res, err);
    }
  });

  // 2. AI Vendor Matching & Ranking (Structured JSON via responseSchema)
  app.post('/api/ai/match-vendors', async (req, res) => {
    try {
      const { event, vendors, existingBookings } = req.body as {
        event: Record<string, unknown>;
        vendors: Array<Record<string, unknown>>;
        existingBookings: Array<Record<string, unknown>>;
      };

      if (!event || !Array.isArray(vendors)) {
        return res.status(400).json({ error: 'Event and vendor catalog are required.' });
      }

      const ai = getAIClient();
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: `Evaluate and rank the best approved vendors for this event.
Event details: ${JSON.stringify(event)}
Existing bookings (check for date conflicts on ${String(event.date)}): ${JSON.stringify(existingBookings ?? [])}
Available vendors: ${JSON.stringify(
          vendors.map((v) => ({
            id: v.id,
            name: v.name,
            category: v.category,
            location: v.location,
            priceMin: v.priceMin,
            priceMax: v.priceMax,
            rating: v.rating,
            reviewCount: v.reviewCount,
            services: v.services,
            bookedDates: v.bookedDates,
            approved: v.approved,
          }))
        )}

Score every approved vendor or top 10 best fitting approved vendors from 0 to 100 based on budget fit, guest count suitability, city/location proximity, rating, and date availability (${String(event.date)}). If a vendor's bookedDates includes the event date, mark availabilityStatus as "Conflict" and lower the score.`,
        config: {
          systemInstruction:
            'You are an intelligent vendor procurement engine. Rank vendors accurately using only the provided vendor IDs.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              recommendations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    vendorId: { type: Type.STRING },
                    category: { type: Type.STRING },
                    matchScore: { type: Type.INTEGER },
                    explanation: { type: Type.STRING },
                    estimatedCost: { type: Type.INTEGER },
                    availabilityStatus: {
                      type: Type.STRING,
                      description: 'Available, Limited, or Conflict',
                    },
                  },
                  required: [
                    'vendorId',
                    'category',
                    'matchScore',
                    'explanation',
                    'estimatedCost',
                    'availabilityStatus',
                  ],
                },
              },
            },
            required: ['summary', 'recommendations'],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim());
      res.json(parsed);
    } catch (err) {
      handleAIError(res, err);
    }
  });

  // 3. AI Compare Vendors Side-by-Side (Structured JSON)
  app.post('/api/ai/compare-vendors', async (req, res) => {
    try {
      const { event, vendors } = req.body as {
        event?: Record<string, unknown>;
        vendors: Array<Record<string, unknown>>;
      };

      if (!Array.isArray(vendors) || vendors.length < 2) {
        return res.status(400).json({ error: 'Select at least 2 vendors to compare.' });
      }

      const ai = getAIClient();
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: `Compare these vendors side-by-side${event ? ` for the event "${String(event.name)}" (Budget: ₹${String(event.budget)}, Guests: ${String(event.guestCount)}, Location: ${String(event.location)}, Date: ${String(event.date)})` : ''}.
Vendors: ${JSON.stringify(vendors)}`,
        config: {
          systemInstruction:
            'You are an impartial procurement advisor. Provide concrete pros, cons, value verdict, and select the strongest overall pick.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              overallSummary: { type: Type.STRING },
              winnerVendorId: { type: Type.STRING },
              winnerReason: { type: Type.STRING },
              vendorAnalyses: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    vendorId: { type: Type.STRING },
                    vendorName: { type: Type.STRING },
                    pros: { type: Type.ARRAY, items: { type: Type.STRING } },
                    cons: { type: Type.ARRAY, items: { type: Type.STRING } },
                    valueVerdict: { type: Type.STRING },
                  },
                  required: ['vendorId', 'vendorName', 'pros', 'cons', 'valueVerdict'],
                },
              },
            },
            required: ['overallSummary', 'winnerVendorId', 'winnerReason', 'vendorAnalyses'],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim());
      res.json(parsed);
    } catch (err) {
      handleAIError(res, err);
    }
  });

  // 4. AI Budget Optimizer (Structured JSON)
  app.post('/api/ai/optimize-budget', async (req, res) => {
    try {
      const { event, bookings, vendors } = req.body as {
        event: Record<string, unknown>;
        bookings: Array<Record<string, unknown>>;
        vendors: Array<Record<string, unknown>>;
      };

      if (!event) {
        return res.status(400).json({ error: 'Event data is required for budget optimization.' });
      }

      const ai = getAIClient();
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: `Analyze this event's planned budget vs actual vendor bookings and suggest concrete savings or cheaper vendor alternatives from the catalog.
Event: ${JSON.stringify(event)}
Bookings for this event: ${JSON.stringify(bookings ?? [])}
Catalog vendors: ${JSON.stringify(
          (vendors ?? []).map((v) => ({
            id: v.id,
            name: v.name,
            category: v.category,
            priceMin: v.priceMin,
            priceMax: v.priceMax,
            rating: v.rating,
            location: v.location,
          }))
        )}`,
        config: {
          systemInstruction:
            'You are a financial controller for live events. Identify overspending risks, suggest negotiation tactics, and recommend cheaper verified catalog alternatives using exact vendor IDs when applicable.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              healthStatus: {
                type: Type.STRING,
                description: 'on_track, at_risk, or over_budget',
              },
              plannedTotal: { type: Type.INTEGER },
              committedTotal: { type: Type.INTEGER },
              variance: { type: Type.INTEGER },
              executiveSummary: { type: Type.STRING },
              overspendingAlerts: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    category: { type: Type.STRING },
                    issue: { type: Type.STRING },
                    impactAmount: { type: Type.INTEGER },
                  },
                  required: ['category', 'issue', 'impactAmount'],
                },
              },
              savingsSuggestions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    potentialSavings: { type: Type.INTEGER },
                    actionDetail: { type: Type.STRING },
                  },
                  required: ['title', 'potentialSavings', 'actionDetail'],
                },
              },
              cheaperAlternatives: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    currentVendorName: { type: Type.STRING },
                    suggestedVendorId: { type: Type.STRING },
                    suggestedVendorName: { type: Type.STRING },
                    estimatedSavings: { type: Type.INTEGER },
                    reason: { type: Type.STRING },
                  },
                  required: [
                    'currentVendorName',
                    'suggestedVendorId',
                    'suggestedVendorName',
                    'estimatedSavings',
                    'reason',
                  ],
                },
              },
            },
            required: [
              'healthStatus',
              'plannedTotal',
              'committedTotal',
              'variance',
              'executiveSummary',
              'overspendingAlerts',
              'savingsSuggestions',
              'cheaperAlternatives',
            ],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim());
      res.json(parsed);
    } catch (err) {
      handleAIError(res, err);
    }
  });

  // 5. AI Chat Assistant (Context-aware)
  app.post('/api/ai/chat', async (req, res) => {
    try {
      const { message, history, context } = req.body as {
        message?: string;
        history?: Array<{ role: 'user' | 'model'; text: string }>;
        context?: Record<string, unknown>;
      };

      if (!message || !message.trim()) {
        return res.status(400).json({ error: 'Message cannot be empty.' });
      }

      const ai = getAIClient();
      const systemInstruction = `You are EventSphere AI Assistant, a concise, practical event operations copilot.
You have live read access to the user's workspace state below:
${JSON.stringify(context ?? {}, null, 2)}

Guidelines:
- Answer questions directly using real names, dates, INR amounts (₹), and booking statuses from the workspace data above.
- If asked which vendors are unconfirmed, list exact bookings with Pending or Negotiating status and their event names.
- If asked to draft messages, vendor emails, invitations, or event announcements, write clean, ready-to-send copy with placeholders only where genuinely missing.
- Keep responses well-structured, concise, and free of fluff.`;

      const contents = [
        ...(history ?? []).map((h) => ({
          role: h.role,
          parts: [{ text: h.text }],
        })),
        { role: 'user', parts: [{ text: message.trim() }] },
      ];

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents,
        config: {
          systemInstruction,
        },
      });

      res.json({ reply: response.text ?? 'I could not generate a response.' });
    } catch (err) {
      handleAIError(res, err);
    }
  });

  // Mount Vite dev middleware or serve static production build
  const isProd = process.env.NODE_ENV === 'production' && fs.existsSync(path.join(__dirname, 'dist'));
  if (isProd) {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`EventSphere AI server listening on http://0.0.0.0:${port}`);
  });
}

startServer();

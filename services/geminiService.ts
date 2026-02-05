import { GoogleGenAI, Type } from "@google/genai";
import { Project, Phase, Task, Priority } from "../types";

// Ensure API Key is present
const apiKey = process.env.API_KEY;
if (!apiKey) {
  console.warn("Missing API_KEY in environment variables. AI features will fail.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || '' });

export const generateProjectPlan = async (goal: string, context?: string): Promise<Partial<Project>> => {
  const modelName = 'gemini-3-flash-preview';

  const systemInstruction = `
    You are an expert Senior Technical Program Manager and Product Owner. 
    Your goal is to break down a high-level user goal into a structured project roadmap.
    
    Rules:
    1. Break the project into logical phases (e.g., Discovery, Planning, Execution, Launch).
    2. For each phase, list actionable concrete tasks.
    3. Estimate effort for each task realistically (e.g., "4 hours", "2 days").
    4. Assign a priority (High, Medium, Low) based on critical path.
    5. Identify potential risks for the project overall.
    6. Keep descriptions concise but professional.
  `;

  const userPrompt = `
    Goal: ${goal}
    ${context ? `Additional Context: ${context}` : ''}
    
    Generate a JSON response representing the project structure.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: userPrompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "A professional title for the project" },
            summary: { type: Type.STRING, description: "Executive summary of the plan" },
            risks: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "List of 3-5 potential risks"
            },
            phases: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "Phase name" },
                  description: { type: Type.STRING, description: "Phase objective" },
                  tasks: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        estimate: { type: Type.STRING, description: "Time estimate" },
                        priority: { type: Type.STRING, enum: ["High", "Medium", "Low"] }
                      },
                      required: ["title", "estimate", "priority"]
                    }
                  }
                },
                required: ["name", "tasks"]
              }
            }
          },
          required: ["title", "summary", "phases", "risks"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const rawData = JSON.parse(text);

    // Hydrate with IDs on the client side
    const phases: Phase[] = rawData.phases.map((p: any, pIdx: number) => ({
      id: `phase-${Date.now()}-${pIdx}`,
      name: p.name,
      description: p.description || '',
      tasks: p.tasks.map((t: any, tIdx: number) => ({
        id: `task-${Date.now()}-${pIdx}-${tIdx}`,
        title: t.title,
        description: t.description || '',
        estimate: t.estimate,
        priority: t.priority as Priority,
        completed: false
      }))
    }));

    return {
      title: rawData.title,
      summary: rawData.summary,
      risks: rawData.risks,
      phases: phases
    };

  } catch (error) {
    console.error("AI Generation Failed:", error);
    throw error;
  }
};

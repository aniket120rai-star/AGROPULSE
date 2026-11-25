import { desc, eq } from 'drizzle-orm';
import { db } from './index.ts';
import {
  bookmarkedGuides,
  chatMessages,
  checklistTasks,
  diagnoses,
  farmPlanItems,
  farmProfiles,
  stageCompletions,
  users,
} from './schema.ts';

export interface FarmProfileInput {
  location: string;
  district: string;
  state: string;
  latitude?: number | null;
  longitude?: number | null;
  landSize: number;
  landUnit: string;
  soilType: string;
  irrigation: string;
  goal: string;
  soilPh: number;
  language?: string;
  customized: boolean;
}

export interface ChecklistTaskInput {
  id: string;
  title: string;
  category: string;
  season: string;
  completed: boolean;
  dueLabel: string;
}

export interface DiagnosisInput {
  id: string;
  timestamp: string;
  cropName: string;
  detectedIssue: string;
  confidence: number;
  status: string;
  summary: string;
  organicTreatment: string[];
  chemicalTreatment: string[];
  preventionSteps: string[];
}

function safeParseArray<T>(jsonText: string, fallback: T[]): T[] {
  try {
    const parsed = JSON.parse(jsonText);
    return Array.isArray(parsed) ? (parsed as T[]) : fallback;
  } catch {
    return fallback;
  }
}

export async function getOrCreateUser(params: {
  uid: string;
  email: string;
  name?: string | null;
  photoUrl?: string | null;
}) {
  try {
    const safeName =
      params.name?.trim() ||
      params.email.split('@')[0]?.replace(/[._-]/g, ' ') ||
      'Farmer';
    const result = await db
      .insert(users)
      .values({
        uid: params.uid,
        email: params.email,
        name: safeName,
        photoUrl: params.photoUrl ?? null,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email: params.email,
          name: safeName,
          photoUrl: params.photoUrl ?? null,
          updatedAt: new Date(),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database query failed in getOrCreateUser:', error);
    throw new Error('Unable to save user profile right now.', { cause: error });
  }
}

export async function getUserByUid(uid: string) {
  try {
    const rows = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
    return rows[0] ?? null;
  } catch (error) {
    console.error('Database query failed in getUserByUid:', error);
    throw new Error('Unable to load user account right now.', { cause: error });
  }
}

export async function getUserFullState(userId: number) {
  try {
    const [
      profileRows,
      planRows,
      taskRows,
      stageRows,
      bookmarkRows,
      diagRows,
      chatRows,
    ] = await Promise.all([
      db.select().from(farmProfiles).where(eq(farmProfiles.userId, userId)).limit(1),
      db.select().from(farmPlanItems).where(eq(farmPlanItems.userId, userId)),
      db.select().from(checklistTasks).where(eq(checklistTasks.userId, userId)),
      db.select().from(stageCompletions).where(eq(stageCompletions.userId, userId)),
      db.select().from(bookmarkedGuides).where(eq(bookmarkedGuides.userId, userId)),
      db
        .select()
        .from(diagnoses)
        .where(eq(diagnoses.userId, userId))
        .orderBy(desc(diagnoses.createdAt))
        .limit(12),
      db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.userId, userId))
        .orderBy(desc(chatMessages.createdAt))
        .limit(40),
    ]);

    const profileRow = profileRows[0] ?? null;
    const completedStages: Record<string, number[]> = {};
    for (const row of stageRows) {
      completedStages[row.cropId] = safeParseArray<number>(row.completedStagesJson, []);
    }

    return {
      farmProfile: profileRow
        ? {
            location: profileRow.location,
            district: profileRow.district,
            state: profileRow.state,
            latitude: profileRow.latitude ?? undefined,
            longitude: profileRow.longitude ?? undefined,
            landSize: profileRow.landSize,
            landUnit: profileRow.landUnit,
            soilType: profileRow.soilType,
            irrigation: profileRow.irrigation,
            goal: profileRow.goal,
            soilPh: profileRow.soilPh,
            customized: profileRow.customized,
          }
        : null,
      language: profileRow?.language ?? null,
      farmPlanIds: planRows.map((p) => p.cropId),
      tasks: taskRows.map((t) => ({
        id: t.clientTaskId,
        title: t.title,
        category: t.category,
        season: t.season,
        completed: t.completed,
        dueLabel: t.dueLabel,
      })),
      completedStages,
      bookmarkedGuides: bookmarkRows.map((b) => b.guideId),
      diagnoses: diagRows.map((d) => ({
        id: d.clientDiagId,
        timestamp: d.timestampLabel,
        cropName: d.cropName,
        detectedIssue: d.detectedIssue,
        confidence: d.confidence,
        status: d.status,
        summary: d.summary,
        organicTreatment: safeParseArray<string>(d.organicTreatmentJson, []),
        chemicalTreatment: safeParseArray<string>(d.chemicalTreatmentJson, []),
        preventionSteps: safeParseArray<string>(d.preventionStepsJson, []),
      })),
      chatMessages: chatRows
        .slice()
        .reverse()
        .map((m) => ({
          id: `db-${m.id}`,
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.content,
          modelUsed: m.modelUsed ?? undefined,
          modeLabel: m.modeLabel ?? undefined,
          timestamp: m.createdAt.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        })),
    };
  } catch (error) {
    console.error('Database query failed in getUserFullState:', error);
    throw new Error('Unable to load farm data from database.', { cause: error });
  }
}

export async function upsertFarmProfile(userId: number, profile: FarmProfileInput) {
  try {
    const result = await db
      .insert(farmProfiles)
      .values({
        userId,
        location: profile.location,
        district: profile.district,
        state: profile.state,
        latitude: profile.latitude ?? null,
        longitude: profile.longitude ?? null,
        landSize: profile.landSize,
        landUnit: profile.landUnit,
        soilType: profile.soilType,
        irrigation: profile.irrigation,
        goal: profile.goal,
        soilPh: profile.soilPh,
        language: profile.language ?? 'en',
        customized: profile.customized,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: farmProfiles.userId,
        set: {
          location: profile.location,
          district: profile.district,
          state: profile.state,
          latitude: profile.latitude ?? null,
          longitude: profile.longitude ?? null,
          landSize: profile.landSize,
          landUnit: profile.landUnit,
          soilType: profile.soilType,
          irrigation: profile.irrigation,
          goal: profile.goal,
          soilPh: profile.soilPh,
          language: profile.language ?? 'en',
          customized: profile.customized,
          updatedAt: new Date(),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database query failed in upsertFarmProfile:', error);
    throw new Error('Unable to update farm profile.', { cause: error });
  }
}

export async function replaceFarmPlan(userId: number, cropIds: string[]) {
  try {
    const uniqueCropIds = Array.from(new Set(cropIds.filter(Boolean)));
    await db.transaction(async (tx) => {
      await tx.delete(farmPlanItems).where(eq(farmPlanItems.userId, userId));
      if (uniqueCropIds.length > 0) {
        await tx.insert(farmPlanItems).values(
          uniqueCropIds.map((cropId) => ({
            userId,
            cropId,
          }))
        );
      }
    });
    return uniqueCropIds;
  } catch (error) {
    console.error('Database query failed in replaceFarmPlan:', error);
    throw new Error('Unable to update farm plan.', { cause: error });
  }
}

export async function replaceChecklistTasks(userId: number, tasks: ChecklistTaskInput[]) {
  try {
    await db.transaction(async (tx) => {
      await tx.delete(checklistTasks).where(eq(checklistTasks.userId, userId));
      if (tasks.length > 0) {
        await tx.insert(checklistTasks).values(
          tasks.slice(0, 100).map((t) => ({
            userId,
            clientTaskId: t.id,
            title: t.title,
            category: t.category,
            season: t.season,
            completed: Boolean(t.completed),
            dueLabel: t.dueLabel,
          }))
        );
      }
    });
  } catch (error) {
    console.error('Database query failed in replaceChecklistTasks:', error);
    throw new Error('Unable to update checklist tasks.', { cause: error });
  }
}

export async function replaceStageCompletions(
  userId: number,
  stagesMap: Record<string, number[]>
) {
  try {
    const entries = Object.entries(stagesMap);
    await db.transaction(async (tx) => {
      await tx.delete(stageCompletions).where(eq(stageCompletions.userId, userId));
      if (entries.length > 0) {
        await tx.insert(stageCompletions).values(
          entries.map(([cropId, list]) => ({
            userId,
            cropId,
            completedStagesJson: JSON.stringify(list),
            updatedAt: new Date(),
          }))
        );
      }
    });
  } catch (error) {
    console.error('Database query failed in replaceStageCompletions:', error);
    throw new Error('Unable to update crop stage progress.', { cause: error });
  }
}

export async function replaceBookmarkedGuides(userId: number, guideIds: string[]) {
  try {
    const uniqueGuides = Array.from(new Set(guideIds.filter(Boolean)));
    await db.transaction(async (tx) => {
      await tx.delete(bookmarkedGuides).where(eq(bookmarkedGuides.userId, userId));
      if (uniqueGuides.length > 0) {
        await tx.insert(bookmarkedGuides).values(
          uniqueGuides.map((guideId) => ({
            userId,
            guideId,
          }))
        );
      }
    });
    return uniqueGuides;
  } catch (error) {
    console.error('Database query failed in replaceBookmarkedGuides:', error);
    throw new Error('Unable to update bookmarked guides.', { cause: error });
  }
}

export async function saveDiagnosisRecord(userId: number, diag: DiagnosisInput) {
  try {
    const result = await db
      .insert(diagnoses)
      .values({
        userId,
        clientDiagId: diag.id,
        cropName: diag.cropName,
        detectedIssue: diag.detectedIssue,
        confidence: diag.confidence,
        status: diag.status,
        summary: diag.summary,
        organicTreatmentJson: JSON.stringify(diag.organicTreatment ?? []),
        chemicalTreatmentJson: JSON.stringify(diag.chemicalTreatment ?? []),
        preventionStepsJson: JSON.stringify(diag.preventionSteps ?? []),
        timestampLabel: diag.timestamp,
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database query failed in saveDiagnosisRecord:', error);
    throw new Error('Unable to save diagnosis.', { cause: error });
  }
}

export async function appendChatMessages(
  userId: number,
  entries: Array<{
    role: 'user' | 'assistant';
    content: string;
    modelUsed?: string;
    modeLabel?: string;
  }>
) {
  try {
    if (entries.length === 0) return;
    await db.insert(chatMessages).values(
      entries.map((entry) => ({
        userId,
        threadId: 'default',
        role: entry.role,
        content: entry.content,
        modelUsed: entry.modelUsed ?? null,
        modeLabel: entry.modeLabel ?? null,
      }))
    );
  } catch (error) {
    console.error('Database query failed in appendChatMessages:', error);
    throw new Error('Unable to save assistant message.', { cause: error });
  }
}

export async function clearChatMessages(userId: number) {
  try {
    await db.delete(chatMessages).where(eq(chatMessages.userId, userId));
  } catch (error) {
    console.error('Database query failed in clearChatMessages:', error);
    throw new Error('Unable to clear chat thread.', { cause: error });
  }
}

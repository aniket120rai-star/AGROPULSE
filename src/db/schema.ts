import { relations } from 'drizzle-orm';
import {
  boolean,
  doublePrecision,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  name: text('name').notNull().default('Farmer'),
  photoUrl: text('photo_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const farmProfiles = pgTable('farm_profiles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull()
    .unique(),
  location: text('location').notNull(),
  district: text('district').notNull(),
  state: text('state').notNull(),
  latitude: doublePrecision('latitude'),
  longitude: doublePrecision('longitude'),
  landSize: doublePrecision('land_size').notNull(),
  landUnit: text('land_unit').notNull(),
  soilType: text('soil_type').notNull(),
  irrigation: text('irrigation').notNull(),
  goal: text('goal').notNull(),
  soilPh: doublePrecision('soil_ph').notNull(),
  language: text('language').notNull().default('en'),
  customized: boolean('customized').notNull().default(false),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const farmPlanItems = pgTable('farm_plan_items', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  cropId: text('crop_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const checklistTasks = pgTable('checklist_tasks', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  clientTaskId: text('client_task_id').notNull(),
  title: text('title').notNull(),
  category: text('category').notNull(),
  season: text('season').notNull(),
  completed: boolean('completed').notNull().default(false),
  dueLabel: text('due_label').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const stageCompletions = pgTable('stage_completions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  cropId: text('crop_id').notNull(),
  completedStagesJson: text('completed_stages_json').notNull().default('[]'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const bookmarkedGuides = pgTable('bookmarked_guides', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  guideId: text('guide_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const diagnoses = pgTable('diagnoses', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  clientDiagId: text('client_diag_id').notNull(),
  cropName: text('crop_name').notNull(),
  detectedIssue: text('detected_issue').notNull(),
  confidence: integer('confidence').notNull(),
  status: text('status').notNull(),
  summary: text('summary').notNull(),
  organicTreatmentJson: text('organic_treatment_json').notNull().default('[]'),
  chemicalTreatmentJson: text('chemical_treatment_json').notNull().default('[]'),
  preventionStepsJson: text('prevention_steps_json').notNull().default('[]'),
  timestampLabel: text('timestamp_label').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const chatMessages = pgTable('chat_messages', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  threadId: text('thread_id').notNull().default('default'),
  role: text('role').notNull(),
  content: text('content').notNull(),
  modelUsed: text('model_used'),
  modeLabel: text('mode_label'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  farmProfile: one(farmProfiles, {
    fields: [users.id],
    references: [farmProfiles.userId],
  }),
  farmPlanItems: many(farmPlanItems),
  checklistTasks: many(checklistTasks),
  stageCompletions: many(stageCompletions),
  bookmarkedGuides: many(bookmarkedGuides),
  diagnoses: many(diagnoses),
  chatMessages: many(chatMessages),
}));

export const farmProfilesRelations = relations(farmProfiles, ({ one }) => ({
  user: one(users, {
    fields: [farmProfiles.userId],
    references: [users.id],
  }),
}));

export const farmPlanItemsRelations = relations(farmPlanItems, ({ one }) => ({
  user: one(users, {
    fields: [farmPlanItems.userId],
    references: [users.id],
  }),
}));

export const checklistTasksRelations = relations(checklistTasks, ({ one }) => ({
  user: one(users, {
    fields: [checklistTasks.userId],
    references: [users.id],
  }),
}));

export const stageCompletionsRelations = relations(stageCompletions, ({ one }) => ({
  user: one(users, {
    fields: [stageCompletions.userId],
    references: [users.id],
  }),
}));

export const bookmarkedGuidesRelations = relations(bookmarkedGuides, ({ one }) => ({
  user: one(users, {
    fields: [bookmarkedGuides.userId],
    references: [users.id],
  }),
}));

export const diagnosesRelations = relations(diagnoses, ({ one }) => ({
  user: one(users, {
    fields: [diagnoses.userId],
    references: [users.id],
  }),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  user: one(users, {
    fields: [chatMessages.userId],
    references: [users.id],
  }),
}));

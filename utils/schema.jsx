import {
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const projectAllocations = pgTable("project_allocations", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  amount: varchar("amount").notNull(),
  icon: varchar("icon"),
  createdBy: varchar("createdBy").notNull(),
});

export const revenueStreams = pgTable("revenue_streams", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  amount: varchar("amount").notNull(),
  icon: varchar("icon"),
  createdBy: varchar("createdBy").notNull(),
});

export const operationalCosts = pgTable("operational_costs", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  amount: numeric("amount").notNull().default(0),
  allocationId: integer("allocationId").references(() => projectAllocations.id),
  createdAt: varchar("createdAt").notNull(),
});

export const rawStatements = pgTable("raw_statements", {
  id: serial("id").primaryKey(),
  fileName: varchar("fileName").notNull(),
  parsedData: text("parsedData").notNull(),
  status: varchar("status").default("pending"),
  createdBy: varchar("createdBy").notNull(),
  uploadedAt: timestamp("uploadedAt").defaultNow(),
});

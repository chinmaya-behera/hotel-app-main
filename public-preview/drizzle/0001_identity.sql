-- Acquire locks for a bounded time and keep the update in Drizzle's transaction.
SET LOCAL lock_timeout = '5s';
--> statement-breakpoint
DO $identity$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM drizzle.__drizzle_migrations
    WHERE created_at = 1794596861484
      AND hash = 'cbb2c262bced3c9cb6abd7b0f138e7bc0e9a4962f24ff830ffa23a751461f15f'
  ) THEN
    RAISE EXCEPTION 'Apply the recorded 53-table baseline before the identity migration';
  END IF;
END;
$identity$;
--> statement-breakpoint
ALTER TABLE "profile_grant" DROP CONSTRAINT "profile_grant_prop_mem_profile_uk";
--> statement-breakpoint
ALTER TABLE "audit_event" DROP CONSTRAINT "audit_event_actor_membership_id_staff_membership_id_fk";
--> statement-breakpoint
ALTER TABLE "audit_event" DROP CONSTRAINT "audit_event_property_id_property_id_fk";
--> statement-breakpoint
ALTER TABLE "connector_outbox" DROP CONSTRAINT "connector_outbox_property_id_property_id_fk";
--> statement-breakpoint
ALTER TABLE "department" DROP CONSTRAINT "department_property_id_property_id_fk";
--> statement-breakpoint
ALTER TABLE "financial_limit" DROP CONSTRAINT "financial_limit_property_id_property_id_fk";
--> statement-breakpoint
ALTER TABLE "financial_limit" DROP CONSTRAINT "financial_limit_profile_grant_id_profile_grant_id_fk";
--> statement-breakpoint
ALTER TABLE "financial_limit" DROP CONSTRAINT "financial_limit_profile_id_profile_id_fk";
--> statement-breakpoint
ALTER TABLE "floor" DROP CONSTRAINT "floor_property_id_property_id_fk";
--> statement-breakpoint
ALTER TABLE "grant_scope" DROP CONSTRAINT "grant_scope_profile_grant_id_profile_grant_id_fk";
--> statement-breakpoint
ALTER TABLE "grant_scope" DROP CONSTRAINT "grant_scope_property_id_property_id_fk";
--> statement-breakpoint
ALTER TABLE "grant_scope" DROP CONSTRAINT "grant_scope_department_id_department_id_fk";
--> statement-breakpoint
ALTER TABLE "grant_scope" DROP CONSTRAINT "grant_scope_outlet_id_outlet_id_fk";
--> statement-breakpoint
ALTER TABLE "grant_scope" DROP CONSTRAINT "grant_scope_floor_id_floor_id_fk";
--> statement-breakpoint
ALTER TABLE "grant_scope" DROP CONSTRAINT "grant_scope_shift_id_shift_id_fk";
--> statement-breakpoint
ALTER TABLE "outlet" DROP CONSTRAINT "outlet_department_id_department_id_fk";
--> statement-breakpoint
ALTER TABLE "outlet" DROP CONSTRAINT "outlet_property_id_property_id_fk";
--> statement-breakpoint
ALTER TABLE "profile_grant" DROP CONSTRAINT "profile_grant_membership_id_staff_membership_id_fk";
--> statement-breakpoint
ALTER TABLE "profile_grant" DROP CONSTRAINT "profile_grant_approved_by_membership_id_staff_membership_id_fk";
--> statement-breakpoint
ALTER TABLE "profile_grant" DROP CONSTRAINT "profile_grant_property_id_property_id_fk";
--> statement-breakpoint
ALTER TABLE "profile_grant" DROP CONSTRAINT "profile_grant_profile_id_profile_id_fk";
--> statement-breakpoint
ALTER TABLE "profile_permission" DROP CONSTRAINT "profile_permission_profile_id_profile_id_fk";
--> statement-breakpoint
ALTER TABLE "profile_permission" DROP CONSTRAINT "profile_permission_permission_code_permission_code_fk";
--> statement-breakpoint
ALTER TABLE "room" DROP CONSTRAINT "room_floor_id_floor_id_fk";
--> statement-breakpoint
ALTER TABLE "room" DROP CONSTRAINT "room_property_id_property_id_fk";
--> statement-breakpoint
ALTER TABLE "shift" DROP CONSTRAINT "shift_property_id_property_id_fk";
--> statement-breakpoint
ALTER TABLE "staff_membership" DROP CONSTRAINT "staff_membership_department_id_department_id_fk";
--> statement-breakpoint
ALTER TABLE "staff_membership" DROP CONSTRAINT "staff_membership_manager_fk";
--> statement-breakpoint
ALTER TABLE "staff_membership" DROP CONSTRAINT "staff_membership_property_id_property_id_fk";
--> statement-breakpoint
ALTER TABLE "staff_membership" DROP CONSTRAINT "staff_membership_staff_account_id_staff_account_id_fk";
--> statement-breakpoint
ALTER TABLE "financial_limit" ALTER COLUMN "profile_grant_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "financial_limit" ALTER COLUMN "profile_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "financial_limit" ALTER COLUMN "maximum_amount" SET DATA TYPE numeric(18, 4);
--> statement-breakpoint
ALTER TABLE "profile_grant" ALTER COLUMN "approved_by_membership_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "financial_limit" ADD CONSTRAINT "financial_limit_grant_action_currency_type_uk" UNIQUE("property_id","profile_grant_id","action_code","currency","transaction_type");
--> statement-breakpoint
ALTER TABLE "profile_grant" ADD CONSTRAINT "profile_grant_property_id_id_profile_id_unique" UNIQUE("property_id","id","profile_id");
--> statement-breakpoint
ALTER TABLE "staff_account" ADD CONSTRAINT "staff_account_oidc_issuer_oidc_subject_unique" UNIQUE("oidc_issuer","oidc_subject");
--> statement-breakpoint
ALTER TABLE "financial_limit" ADD CONSTRAINT "financial_limit_currency_format" CHECK ("financial_limit"."currency" ~ '^[A-Z]{3}$');
--> statement-breakpoint
ALTER TABLE "grant_scope" ADD CONSTRAINT "grant_scope_outlet_requires_department" CHECK ("grant_scope"."outlet_id" is null or "grant_scope"."department_id" is not null);
--> statement-breakpoint
ALTER TABLE "audit_event" ADD CONSTRAINT "audit_event_actor_property_fk" FOREIGN KEY ("property_id","actor_membership_id") REFERENCES "public"."staff_membership"("property_id","id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "audit_event" ADD CONSTRAINT "audit_event_property_id_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."property"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "connector_outbox" ADD CONSTRAINT "connector_outbox_property_id_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."property"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "department" ADD CONSTRAINT "department_property_id_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."property"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "financial_limit" ADD CONSTRAINT "financial_limit_grant_profile_fk" FOREIGN KEY ("property_id","profile_grant_id","profile_id") REFERENCES "public"."profile_grant"("property_id","id","profile_id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "financial_limit" ADD CONSTRAINT "financial_limit_profile_permission_fk" FOREIGN KEY ("profile_id","action_code") REFERENCES "public"."profile_permission"("profile_id","permission_code") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "floor" ADD CONSTRAINT "floor_property_id_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."property"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "grant_scope" ADD CONSTRAINT "grant_scope_grant_property_fk" FOREIGN KEY ("property_id","profile_grant_id") REFERENCES "public"."profile_grant"("property_id","id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "grant_scope" ADD CONSTRAINT "grant_scope_department_property_fk" FOREIGN KEY ("property_id","department_id") REFERENCES "public"."department"("property_id","id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "grant_scope" ADD CONSTRAINT "grant_scope_outlet_department_fk" FOREIGN KEY ("property_id","department_id","outlet_id") REFERENCES "public"."outlet"("property_id","department_id","id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "grant_scope" ADD CONSTRAINT "grant_scope_floor_property_fk" FOREIGN KEY ("property_id","floor_id") REFERENCES "public"."floor"("property_id","id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "grant_scope" ADD CONSTRAINT "grant_scope_shift_property_fk" FOREIGN KEY ("property_id","shift_id") REFERENCES "public"."shift"("property_id","id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "outlet" ADD CONSTRAINT "outlet_department_property_fk" FOREIGN KEY ("property_id","department_id") REFERENCES "public"."department"("property_id","id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "outlet" ADD CONSTRAINT "outlet_property_id_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."property"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "profile_grant" ADD CONSTRAINT "profile_grant_membership_property_fk" FOREIGN KEY ("property_id","membership_id") REFERENCES "public"."staff_membership"("property_id","id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "profile_grant" ADD CONSTRAINT "profile_grant_approver_property_fk" FOREIGN KEY ("property_id","approved_by_membership_id") REFERENCES "public"."staff_membership"("property_id","id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "profile_grant" ADD CONSTRAINT "profile_grant_property_id_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."property"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "profile_grant" ADD CONSTRAINT "profile_grant_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "profile_permission" ADD CONSTRAINT "profile_permission_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "profile_permission" ADD CONSTRAINT "profile_permission_permission_code_permission_code_fk" FOREIGN KEY ("permission_code") REFERENCES "public"."permission"("code") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "room" ADD CONSTRAINT "room_floor_property_fk" FOREIGN KEY ("property_id","floor_id") REFERENCES "public"."floor"("property_id","id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "room" ADD CONSTRAINT "room_property_id_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."property"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "shift" ADD CONSTRAINT "shift_property_id_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."property"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "staff_membership" ADD CONSTRAINT "staff_membership_manager_property_fk" FOREIGN KEY ("property_id","manager_membership_id") REFERENCES "public"."staff_membership"("property_id","id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "staff_membership" ADD CONSTRAINT "staff_membership_department_property_fk" FOREIGN KEY ("property_id","department_id") REFERENCES "public"."department"("property_id","id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "staff_membership" ADD CONSTRAINT "staff_membership_property_id_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."property"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "staff_membership" ADD CONSTRAINT "staff_membership_staff_account_id_staff_account_id_fk" FOREIGN KEY ("staff_account_id") REFERENCES "public"."staff_account"("id") ON DELETE no action ON UPDATE no action;

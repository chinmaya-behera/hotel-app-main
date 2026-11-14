CREATE TABLE "audit_event" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"property_id" text NOT NULL,
	"actor_membership_id" text,
	"action" text NOT NULL,
	"resource_type" text NOT NULL,
	"resource_id" text NOT NULL,
	"payload" jsonb,
	"outcome" text DEFAULT 'success' NOT NULL,
	"ip_address" text,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "audit_event_prop_id_uk" UNIQUE("property_id","id")
);
--> statement-breakpoint
CREATE TABLE "connector_outbox" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"property_id" text NOT NULL,
	"event_type" text NOT NULL,
	"aggregate_id" text NOT NULL,
	"payload" jsonb NOT NULL,
	"schema_version" integer DEFAULT 1 NOT NULL,
	"correlation_id" text,
	"delivery_status" text DEFAULT 'pending' NOT NULL,
	"available_at" timestamp with time zone DEFAULT now() NOT NULL,
	"delivered_at" timestamp with time zone,
	"lease_expires_at" timestamp with time zone,
	CONSTRAINT "connector_outbox_prop_id_uk" UNIQUE("property_id","id"),
	CONSTRAINT "connector_outbox_schema_version_positive" CHECK ("connector_outbox"."schema_version" > 0)
);
--> statement-breakpoint
CREATE TABLE "department" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"property_id" text NOT NULL,
	"name" text NOT NULL,
	"code" text,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "dept_prop_id_uk" UNIQUE("property_id","id"),
	CONSTRAINT "dept_prop_name_uk" UNIQUE("property_id","name")
);
--> statement-breakpoint
CREATE TABLE "financial_limit" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"property_id" text NOT NULL,
	"profile_grant_id" text,
	"profile_id" text,
	"role_code" text DEFAULT 'front_desk' NOT NULL,
	"action_code" text NOT NULL,
	"currency" text DEFAULT 'INR' NOT NULL,
	"transaction_type" text DEFAULT 'refund' NOT NULL,
	"maximum_amount" numeric(18, 2) NOT NULL,
	CONSTRAINT "financial_limit_prop_id_uk" UNIQUE("property_id","id"),
	CONSTRAINT "financial_limit_positive_amount" CHECK ("financial_limit"."maximum_amount" > 0 and "financial_limit"."maximum_amount" <> 'NaN'::numeric)
);
--> statement-breakpoint
CREATE TABLE "floor" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"property_id" text NOT NULL,
	"floor_number" integer DEFAULT 1 NOT NULL,
	"label" text NOT NULL,
	"building_wing" text DEFAULT 'Main',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "floor_prop_id_uk" UNIQUE("property_id","id"),
	CONSTRAINT "floor_prop_label_uk" UNIQUE("property_id","label")
);
--> statement-breakpoint
CREATE TABLE "grant_scope" (
	"profile_grant_id" text PRIMARY KEY NOT NULL,
	"property_id" text NOT NULL,
	"department_id" text,
	"outlet_id" text,
	"floor_id" text,
	"shift_id" text,
	CONSTRAINT "grant_scope_prop_grant_uk" UNIQUE("property_id","profile_grant_id")
);
--> statement-breakpoint
CREATE TABLE "outlet" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"property_id" text NOT NULL,
	"department_id" text NOT NULL,
	"name" text NOT NULL,
	"code" text,
	"outlet_type" text DEFAULT 'restaurant' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "outlet_prop_id_uk" UNIQUE("property_id","id"),
	CONSTRAINT "outlet_prop_dept_id_uk" UNIQUE("property_id","department_id","id"),
	CONSTRAINT "outlet_prop_dept_name_uk" UNIQUE("property_id","department_id","name")
);
--> statement-breakpoint
CREATE TABLE "permission" (
	"code" text PRIMARY KEY NOT NULL,
	"description" text NOT NULL,
	"category" text DEFAULT 'general'
);
--> statement-breakpoint
CREATE TABLE "profile_grant" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"property_id" text NOT NULL,
	"membership_id" text NOT NULL,
	"profile_id" text NOT NULL,
	"approved_by_membership_id" text,
	"valid_from" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "profile_grant_prop_id_uk" UNIQUE("property_id","id"),
	CONSTRAINT "profile_grant_prop_mem_profile_uk" UNIQUE("property_id","membership_id","profile_id"),
	CONSTRAINT "profile_grant_expiry_order" CHECK ("profile_grant"."expires_at" is null or "profile_grant"."expires_at" > "profile_grant"."valid_from")
);
--> statement-breakpoint
CREATE TABLE "profile_permission" (
	"profile_id" text NOT NULL,
	"permission_code" text NOT NULL,
	CONSTRAINT "profile_permission_profile_id_permission_code_pk" PRIMARY KEY("profile_id","permission_code")
);
--> statement-breakpoint
CREATE TABLE "profile" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	CONSTRAINT "profile_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "property" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"name" text NOT NULL,
	"time_zone" text DEFAULT 'Asia/Kolkata' NOT NULL,
	"address" text,
	"phone" text,
	"email" text,
	"currency" text DEFAULT 'INR' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "room" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"property_id" text NOT NULL,
	"floor_id" text NOT NULL,
	"room_number" text NOT NULL,
	"room_type" text NOT NULL,
	"cleanliness_status" text DEFAULT 'ready' NOT NULL,
	"occupancy_status" text DEFAULT 'vacant' NOT NULL,
	"bed_type" text DEFAULT 'King',
	"max_occupancy" integer DEFAULT 2,
	"rack_rate" numeric(10, 2) DEFAULT '15000.00',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "room_prop_id_uk" UNIQUE("property_id","id"),
	CONSTRAINT "room_prop_number_uk" UNIQUE("property_id","room_number")
);
--> statement-breakpoint
CREATE TABLE "shift" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"property_id" text NOT NULL,
	"name" text DEFAULT 'Morning Shift' NOT NULL,
	"shift_code" text DEFAULT 'MORN',
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shift_prop_id_uk" UNIQUE("property_id","id"),
	CONSTRAINT "shift_time_order" CHECK ("shift"."ends_at" > "shift"."starts_at")
);
--> statement-breakpoint
CREATE TABLE "staff_account" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"oidc_issuer" text DEFAULT 'local' NOT NULL,
	"oidc_subject" text,
	"employee_identifier" text NOT NULL,
	"full_name" text DEFAULT 'Staff Member' NOT NULL,
	"email" text,
	"phone" text,
	"role" text DEFAULT 'staff' NOT NULL,
	"avatar_url" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "staff_account_emp_uk" UNIQUE("employee_identifier")
);
--> statement-breakpoint
CREATE TABLE "staff_membership" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"property_id" text NOT NULL,
	"staff_account_id" text NOT NULL,
	"department_id" text,
	"manager_membership_id" text,
	"job_title" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "staff_membership_prop_id_uk" UNIQUE("property_id","id"),
	CONSTRAINT "staff_membership_account_prop_uk" UNIQUE("staff_account_id","property_id"),
	CONSTRAINT "staff_membership_manager_not_self" CHECK ("staff_membership"."manager_membership_id" <> "staff_membership"."id")
);
--> statement-breakpoint
CREATE TABLE "case_link" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"property_id" text NOT NULL,
	"source_case_id" text NOT NULL,
	"target_case_id" text NOT NULL,
	"relationship" text DEFAULT 'related' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "case_link_not_self" CHECK ("case_link"."source_case_id" <> "case_link"."target_case_id")
);
--> statement-breakpoint
CREATE TABLE "case_message" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"property_id" text NOT NULL,
	"case_id" text NOT NULL,
	"author_membership_id" text,
	"is_from_guest" boolean DEFAULT false NOT NULL,
	"sender_name" text NOT NULL,
	"message" text NOT NULL,
	"channel" text DEFAULT 'in_app' NOT NULL,
	"delivery_status" text DEFAULT 'delivered' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coverage_contact" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"property_id" text NOT NULL,
	"department_id" text NOT NULL,
	"category_id" text,
	"shift_id" text,
	"primary_membership_id" text NOT NULL,
	"backup_membership_id" text,
	"escalation_level" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "department_task" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"ref" text NOT NULL,
	"property_id" text NOT NULL,
	"case_id" text,
	"department_id" text NOT NULL,
	"category_id" text,
	"parent_task_id" text,
	"room_id" text,
	"room_number" text,
	"stay_id" text,
	"title" text NOT NULL,
	"instructions" text,
	"notes" text,
	"priority" text DEFAULT 'normal' NOT NULL,
	"status" text DEFAULT 'submitted' NOT NULL,
	"assignee_membership_id" text,
	"assignee_name" text,
	"guest_visible" boolean DEFAULT true NOT NULL,
	"source" text DEFAULT 'guest_portal',
	"blocker_reason" text,
	"blocker_photo_url" text,
	"acknowledgement_due_at" timestamp with time zone,
	"acknowledged_at" timestamp with time zone,
	"completion_due_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "department_task_ref_unique" UNIQUE("ref"),
	CONSTRAINT "dept_task_prop_id_uk" UNIQUE("property_id","id")
);
--> statement-breakpoint
CREATE TABLE "dining_menu_item" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"property_id" text NOT NULL,
	"outlet_id" text,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"description" text,
	"price" numeric(10, 2) NOT NULL,
	"is_vegetarian" boolean DEFAULT false NOT NULL,
	"is_vegan" boolean DEFAULT false NOT NULL,
	"is_gluten_free" boolean DEFAULT false NOT NULL,
	"allergens" text[],
	"calories" integer,
	"image_url" text,
	"is_available" boolean DEFAULT true NOT NULL,
	"is_86ed" boolean DEFAULT false NOT NULL,
	"preparation_minutes" integer DEFAULT 20 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dining_order_item" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"order_id" text NOT NULL,
	"menu_item_id" text NOT NULL,
	"item_name" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"special_requests" text,
	"total_price" numeric(10, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dining_order" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"order_number" text NOT NULL,
	"property_id" text NOT NULL,
	"stay_id" text,
	"room_number" text NOT NULL,
	"outlet_id" text,
	"guest_name" text NOT NULL,
	"status" text DEFAULT 'received' NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL,
	"tax" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"special_instructions" text,
	"estimated_delivery_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"related_task_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "dining_order_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "escalation" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"ref" text NOT NULL,
	"property_id" text NOT NULL,
	"task_id" text NOT NULL,
	"recipient_membership_id" text NOT NULL,
	"escalation_level" integer DEFAULT 1 NOT NULL,
	"trigger_code" text NOT NULL,
	"title" text NOT NULL,
	"severity" text DEFAULT 'urgent' NOT NULL,
	"due_at" timestamp with time zone NOT NULL,
	"delivery_status" text DEFAULT 'sent' NOT NULL,
	"acknowledged_at" timestamp with time zone,
	"resolved_at" timestamp with time zone,
	"resolution_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "escalation_ref_unique" UNIQUE("ref")
);
--> statement-breakpoint
CREATE TABLE "guest_case" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"ref" text NOT NULL,
	"property_id" text NOT NULL,
	"stay_id" text,
	"room_id" text,
	"room_number" text,
	"guest_name" text,
	"owner_membership_id" text,
	"title" text NOT NULL,
	"description" text,
	"priority" text DEFAULT 'normal' NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"source" text DEFAULT 'guest_portal' NOT NULL,
	"category" text,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone,
	CONSTRAINT "guest_case_ref_unique" UNIQUE("ref"),
	CONSTRAINT "guest_case_prop_id_uk" UNIQUE("property_id","id")
);
--> statement-breakpoint
CREATE TABLE "incident_access" (
	"incident_id" text NOT NULL,
	"membership_id" text NOT NULL,
	"property_id" text NOT NULL,
	"approved_by_membership_id" text,
	"access_level" text DEFAULT 'read_only' NOT NULL,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	CONSTRAINT "incident_access_incident_id_membership_id_pk" PRIMARY KEY("incident_id","membership_id")
);
--> statement-breakpoint
CREATE TABLE "incident_action" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"property_id" text NOT NULL,
	"incident_id" text NOT NULL,
	"actor_membership_id" text,
	"actor_name" text NOT NULL,
	"action_type" text NOT NULL,
	"description" text NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "incident_evidence" (
	"incident_id" text NOT NULL,
	"attachment_id" text NOT NULL,
	"property_id" text NOT NULL,
	"recorded_by_membership_id" text,
	"caption" text,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "incident_evidence_incident_id_attachment_id_pk" PRIMARY KEY("incident_id","attachment_id")
);
--> statement-breakpoint
CREATE TABLE "incident" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"ref" text NOT NULL,
	"property_id" text NOT NULL,
	"case_id" text,
	"related_task_ref" text,
	"title" text NOT NULL,
	"severity" text DEFAULT 'moderate' NOT NULL,
	"status" text DEFAULT 'investigating' NOT NULL,
	"affected_area" text NOT NULL,
	"department" text NOT NULL,
	"coordinator" text NOT NULL,
	"reported_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone,
	"resolution_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "incident_ref_unique" UNIQUE("ref"),
	CONSTRAINT "incident_prop_id_uk" UNIQUE("property_id","id")
);
--> statement-breakpoint
CREATE TABLE "maintenance_asset" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"property_id" text NOT NULL,
	"department_id" text,
	"name" text NOT NULL,
	"asset_code" text NOT NULL,
	"category" text NOT NULL,
	"location" text NOT NULL,
	"status" text DEFAULT 'operational' NOT NULL,
	"interval_days" integer DEFAULT 30 NOT NULL,
	"last_serviced_at" timestamp with time zone,
	"next_due_at" timestamp with time zone NOT NULL,
	"active_work_order_ref" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "maintenance_asset_asset_code_unique" UNIQUE("asset_code")
);
--> statement-breakpoint
CREATE TABLE "shift_handover" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"property_id" text NOT NULL,
	"department_id" text NOT NULL,
	"outgoing_shift_id" text,
	"incoming_shift_id" text,
	"from_membership_id" text NOT NULL,
	"next_owner_membership_id" text NOT NULL,
	"backup_membership_id" text,
	"summary" text NOT NULL,
	"open_tasks_count" integer DEFAULT 0 NOT NULL,
	"critical_notes" text,
	"next_action" text,
	"eta" timestamp with time zone,
	"acknowledged_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sla_policy" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"property_id" text NOT NULL,
	"category_id" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"priority" text DEFAULT 'normal' NOT NULL,
	"acknowledgement_seconds" integer DEFAULT 900 NOT NULL,
	"completion_seconds" integer DEFAULT 2700 NOT NULL,
	"warning_seconds" integer DEFAULT 1800 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sla_policy_prop_cat_ver_uk" UNIQUE("property_id","category_id","version","priority")
);
--> statement-breakpoint
CREATE TABLE "supervisor_inspection" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"ref" text NOT NULL,
	"property_id" text NOT NULL,
	"task_id" text,
	"room_id" text,
	"room_number" text NOT NULL,
	"room_type" text NOT NULL,
	"floor" integer NOT NULL,
	"floor_zone" text,
	"attendant_name" text NOT NULL,
	"attendant_id" text NOT NULL,
	"supervisor_membership_id" text,
	"supervisor_name" text,
	"type" text DEFAULT 'checkout' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"score" integer,
	"checklist" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"notes" text,
	"reopen_reason" text,
	"deadline" text,
	"inspected_at" timestamp with time zone,
	"scheduled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "supervisor_inspection_ref_unique" UNIQUE("ref")
);
--> statement-breakpoint
CREATE TABLE "task_category" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"property_id" text NOT NULL,
	"department_id" text NOT NULL,
	"name" text NOT NULL,
	"code" text,
	"default_priority" text DEFAULT 'normal' NOT NULL,
	"sla_response_minutes" integer DEFAULT 15 NOT NULL,
	"sla_resolution_minutes" integer DEFAULT 45 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "task_category_prop_dept_name_uk" UNIQUE("property_id","department_id","name")
);
--> statement-breakpoint
CREATE TABLE "task_checklist_item" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"property_id" text NOT NULL,
	"task_id" text NOT NULL,
	"label" text NOT NULL,
	"required" boolean DEFAULT true NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp with time zone,
	"completed_by_membership_id" text,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "task_event" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"property_id" text NOT NULL,
	"task_id" text NOT NULL,
	"actor_membership_id" text,
	"event_type" text NOT NULL,
	"from_status" text,
	"to_status" text,
	"notes" text,
	"metadata" jsonb,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wellness_booking" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"property_id" text NOT NULL,
	"stay_id" text,
	"guest_name" text NOT NULL,
	"room_number" text NOT NULL,
	"treatment" text NOT NULL,
	"therapist_id" text,
	"therapist_name" text,
	"treatment_room" text NOT NULL,
	"start_time" timestamp with time zone NOT NULL,
	"duration_minutes" integer DEFAULT 60 NOT NULL,
	"status" text DEFAULT 'booked' NOT NULL,
	"price" numeric(10, 2),
	"task_ref" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attachment" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"property_id" text NOT NULL,
	"object_key" text NOT NULL,
	"file_name" text NOT NULL,
	"content_digest" text,
	"media_type" text NOT NULL,
	"byte_size" integer DEFAULT 0 NOT NULL,
	"classification" text DEFAULT 'general' NOT NULL,
	"scan_status" text DEFAULT 'clean' NOT NULL,
	"uploaded_by_membership_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "attachment_object_key_unique" UNIQUE("object_key")
);
--> statement-breakpoint
CREATE TABLE "emergency_broadcast" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"ref" text NOT NULL,
	"property_id" text NOT NULL,
	"title" text NOT NULL,
	"alert_type" text NOT NULL,
	"severity" text NOT NULL,
	"message" text NOT NULL,
	"instructions" text NOT NULL,
	"target_scope" text NOT NULL,
	"status" text NOT NULL,
	"incident_ref" text,
	"target_recipient_count" integer DEFAULT 0 NOT NULL,
	"broadcast_delivery_status" text DEFAULT 'simulated' NOT NULL,
	"created_by_staff_id" text NOT NULL,
	"created_by_staff_name" text NOT NULL,
	"activated_by_staff_id" text,
	"activated_by_staff_name" text,
	"activated_at" timestamp with time zone,
	"resolved_by_staff_id" text,
	"resolved_by_staff_name" text,
	"resolved_at" timestamp with time zone,
	"resolution_notes" text,
	"cancelled_by_staff_id" text,
	"cancelled_at" timestamp with time zone,
	"cancelled_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "emergency_broadcast_ref_unique" UNIQUE("ref")
);
--> statement-breakpoint
CREATE TABLE "financial_approval" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"property_id" text NOT NULL,
	"exception_id" text NOT NULL,
	"approver_membership_id" text,
	"approver_name" text NOT NULL,
	"approver_role" text NOT NULL,
	"decision" text NOT NULL,
	"approved_amount" numeric(10, 2),
	"review_notes" text,
	"decided_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "financial_evidence" (
	"exception_id" text NOT NULL,
	"attachment_id" text NOT NULL,
	"property_id" text NOT NULL,
	CONSTRAINT "financial_evidence_exception_id_attachment_id_pk" PRIMARY KEY("exception_id","attachment_id")
);
--> statement-breakpoint
CREATE TABLE "financial_exception" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"ref" text NOT NULL,
	"property_id" text NOT NULL,
	"case_id" text,
	"stay_id" text,
	"room_number" text NOT NULL,
	"guest_name" text NOT NULL,
	"requested_by_membership_id" text,
	"requested_by_name" text NOT NULL,
	"action_type" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'INR' NOT NULL,
	"reason_code" text NOT NULL,
	"reason_details" text NOT NULL,
	"status" text DEFAULT 'pending_approval' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "financial_exception_ref_unique" UNIQUE("ref"),
	CONSTRAINT "fin_exception_amount_positive" CHECK ("financial_exception"."amount" > 0)
);
--> statement-breakpoint
CREATE TABLE "financial_execution" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"property_id" text NOT NULL,
	"approval_id" text NOT NULL,
	"exception_id" text NOT NULL,
	"executor_membership_id" text,
	"executor_name" text NOT NULL,
	"provider" text DEFAULT 'razorpay' NOT NULL,
	"provider_reference" text,
	"idempotency_key" text NOT NULL,
	"payout_method" text DEFAULT 'original_payment_method' NOT NULL,
	"outcome" text DEFAULT 'settled' NOT NULL,
	"settled_at" timestamp with time zone,
	"failure_reason" text,
	"executed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "financial_execution_approval_id_unique" UNIQUE("approval_id"),
	CONSTRAINT "financial_execution_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "folio_adjustment" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"ref" text NOT NULL,
	"property_id" text NOT NULL,
	"stay_id" text NOT NULL,
	"room_number" text NOT NULL,
	"category" text NOT NULL,
	"description" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'INR' NOT NULL,
	"posted_by_membership_id" text,
	"posted_by_name" text NOT NULL,
	"idempotency_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "folio_adjustment_ref_unique" UNIQUE("ref"),
	CONSTRAINT "folio_adjustment_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "guest_feedback" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"property_id" text NOT NULL,
	"stay_id" text NOT NULL,
	"task_id" text,
	"rating" integer NOT NULL,
	"category" text DEFAULT 'overall',
	"comments" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "guest_feedback_rating_range" CHECK ("guest_feedback"."rating" >= 1 and "guest_feedback"."rating" <= 5)
);
--> statement-breakpoint
CREATE TABLE "guest_reminder" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"property_id" text NOT NULL,
	"stay_id" text,
	"room_number" text NOT NULL,
	"guest_name" text NOT NULL,
	"title" text NOT NULL,
	"instructions" text,
	"reminder_type" text NOT NULL,
	"due_date_time" timestamp with time zone NOT NULL,
	"lead_minutes" integer DEFAULT 15 NOT NULL,
	"alert_at" timestamp with time zone NOT NULL,
	"priority" text NOT NULL,
	"status" text NOT NULL,
	"alarm_state" text DEFAULT 'scheduled' NOT NULL,
	"snooze_count" integer DEFAULT 0 NOT NULL,
	"snoozed_until" timestamp with time zone,
	"assigned_to" text,
	"case_ref" text,
	"notes" text,
	"created_by" text NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guest_session" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"session_token" text NOT NULL,
	"stay_id" text NOT NULL,
	"room_id" text NOT NULL,
	"room_number" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"is_revoked" boolean DEFAULT false NOT NULL,
	"revoked_reason" text,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "guest_session_session_token_unique" UNIQUE("session_token")
);
--> statement-breakpoint
CREATE TABLE "lost_found_item" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"ref" text NOT NULL,
	"property_id" text NOT NULL,
	"item_name" text NOT NULL,
	"category" text NOT NULL,
	"description" text NOT NULL,
	"found_location" text NOT NULL,
	"found_date" timestamp with time zone NOT NULL,
	"room_number" text,
	"stay_id" text,
	"storage_location" text NOT NULL,
	"sensitive" boolean DEFAULT false NOT NULL,
	"photo_storage_key" text,
	"registered_by_staff_id" text NOT NULL,
	"registered_by_staff_name" text NOT NULL,
	"status" text NOT NULL,
	"claimant_name" text,
	"claimant_contact" text,
	"claimant_verification_method" text,
	"claimed_at" timestamp with time zone,
	"released_by_staff_id" text,
	"released_by_staff_name" text,
	"released_at" timestamp with time zone,
	"disposal_reason" text,
	"disposed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lost_found_item_ref_unique" UNIQUE("ref")
);
--> statement-breakpoint
CREATE TABLE "qr_mapping" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"property_id" text NOT NULL,
	"room_id" text NOT NULL,
	"room_number" text NOT NULL,
	"static_hmac_signature" text NOT NULL,
	"secret_key" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reconciliation" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"property_id" text NOT NULL,
	"execution_id" text NOT NULL,
	"reviewer_membership_id" text,
	"settlement_reference" text,
	"outcome" text DEFAULT 'verified' NOT NULL,
	"notes" text,
	"reviewed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "room_assignment" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"stay_id" text NOT NULL,
	"room_id" text NOT NULL,
	"room_number" text NOT NULL,
	"property_id" text NOT NULL,
	"floor" integer NOT NULL,
	"room_type" text NOT NULL,
	"dnd_active" boolean DEFAULT false NOT NULL,
	"cleanliness_status" text DEFAULT 'ready' NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"unassigned_at" timestamp with time zone,
	"is_current" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stay_context" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"property_id" text NOT NULL,
	"booking_reference" text NOT NULL,
	"guest_first_name" text NOT NULL,
	"guest_last_name" text NOT NULL,
	"guest_email" text,
	"guest_phone" text,
	"welcome_tv_pin" text NOT NULL,
	"status" text DEFAULT 'reserved' NOT NULL,
	"check_in_time" timestamp with time zone NOT NULL,
	"check_out_time" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stay_context_booking_reference_unique" UNIQUE("booking_reference"),
	CONSTRAINT "stay_prop_id_uk" UNIQUE("property_id","id")
);
--> statement-breakpoint
CREATE TABLE "vip_directives" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"property_id" text NOT NULL,
	"guest_name" text NOT NULL,
	"vip_tier" text DEFAULT 'VIP' NOT NULL,
	"room_number" text,
	"special_directives" text,
	"dietary_preferences" text,
	"security_notes" text,
	"assigned_butler_staff_id" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_event" ADD CONSTRAINT "audit_event_property_id_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."property"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_event" ADD CONSTRAINT "audit_event_actor_membership_id_staff_membership_id_fk" FOREIGN KEY ("actor_membership_id") REFERENCES "public"."staff_membership"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connector_outbox" ADD CONSTRAINT "connector_outbox_property_id_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."property"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "department" ADD CONSTRAINT "department_property_id_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."property"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_limit" ADD CONSTRAINT "financial_limit_property_id_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."property"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_limit" ADD CONSTRAINT "financial_limit_profile_grant_id_profile_grant_id_fk" FOREIGN KEY ("profile_grant_id") REFERENCES "public"."profile_grant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_limit" ADD CONSTRAINT "financial_limit_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "floor" ADD CONSTRAINT "floor_property_id_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."property"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grant_scope" ADD CONSTRAINT "grant_scope_profile_grant_id_profile_grant_id_fk" FOREIGN KEY ("profile_grant_id") REFERENCES "public"."profile_grant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grant_scope" ADD CONSTRAINT "grant_scope_property_id_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."property"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grant_scope" ADD CONSTRAINT "grant_scope_department_id_department_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."department"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grant_scope" ADD CONSTRAINT "grant_scope_outlet_id_outlet_id_fk" FOREIGN KEY ("outlet_id") REFERENCES "public"."outlet"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grant_scope" ADD CONSTRAINT "grant_scope_floor_id_floor_id_fk" FOREIGN KEY ("floor_id") REFERENCES "public"."floor"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grant_scope" ADD CONSTRAINT "grant_scope_shift_id_shift_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."shift"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outlet" ADD CONSTRAINT "outlet_property_id_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."property"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outlet" ADD CONSTRAINT "outlet_department_id_department_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."department"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_grant" ADD CONSTRAINT "profile_grant_property_id_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."property"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_grant" ADD CONSTRAINT "profile_grant_membership_id_staff_membership_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."staff_membership"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_grant" ADD CONSTRAINT "profile_grant_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_grant" ADD CONSTRAINT "profile_grant_approved_by_membership_id_staff_membership_id_fk" FOREIGN KEY ("approved_by_membership_id") REFERENCES "public"."staff_membership"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_permission" ADD CONSTRAINT "profile_permission_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_permission" ADD CONSTRAINT "profile_permission_permission_code_permission_code_fk" FOREIGN KEY ("permission_code") REFERENCES "public"."permission"("code") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room" ADD CONSTRAINT "room_property_id_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."property"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room" ADD CONSTRAINT "room_floor_id_floor_id_fk" FOREIGN KEY ("floor_id") REFERENCES "public"."floor"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift" ADD CONSTRAINT "shift_property_id_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."property"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_membership" ADD CONSTRAINT "staff_membership_property_id_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."property"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_membership" ADD CONSTRAINT "staff_membership_staff_account_id_staff_account_id_fk" FOREIGN KEY ("staff_account_id") REFERENCES "public"."staff_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_membership" ADD CONSTRAINT "staff_membership_department_id_department_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."department"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_membership" ADD CONSTRAINT "staff_membership_manager_fk" FOREIGN KEY ("manager_membership_id") REFERENCES "public"."staff_membership"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_link" ADD CONSTRAINT "case_link_property_id_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."property"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_link" ADD CONSTRAINT "case_link_source_case_id_guest_case_id_fk" FOREIGN KEY ("source_case_id") REFERENCES "public"."guest_case"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_link" ADD CONSTRAINT "case_link_target_case_id_guest_case_id_fk" FOREIGN KEY ("target_case_id") REFERENCES "public"."guest_case"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_message" ADD CONSTRAINT "case_message_property_id_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."property"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_message" ADD CONSTRAINT "case_message_case_id_guest_case_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."guest_case"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_message" ADD CONSTRAINT "case_message_author_membership_id_staff_membership_id_fk" FOREIGN KEY ("author_membership_id") REFERENCES "public"."staff_membership"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coverage_contact" ADD CONSTRAINT "coverage_contact_property_id_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."property"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coverage_contact" ADD CONSTRAINT "coverage_contact_department_id_department_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."department"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coverage_contact" ADD CONSTRAINT "coverage_contact_category_id_task_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."task_category"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coverage_contact" ADD CONSTRAINT "coverage_contact_shift_id_shift_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."shift"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coverage_contact" ADD CONSTRAINT "coverage_contact_primary_membership_id_staff_membership_id_fk" FOREIGN KEY ("primary_membership_id") REFERENCES "public"."staff_membership"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coverage_contact" ADD CONSTRAINT "coverage_contact_backup_membership_id_staff_membership_id_fk" FOREIGN KEY ("backup_membership_id") REFERENCES "public"."staff_membership"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "department_task" ADD CONSTRAINT "department_task_property_id_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."property"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "department_task" ADD CONSTRAINT "department_task_case_id_guest_case_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."guest_case"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "department_task" ADD CONSTRAINT "department_task_department_id_department_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."department"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "department_task" ADD CONSTRAINT "department_task_category_id_task_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."task_category"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "department_task" ADD CONSTRAINT "department_task_room_id_room_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."room"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "department_task" ADD CONSTRAINT "department_task_stay_id_stay_context_id_fk" FOREIGN KEY ("stay_id") REFERENCES "public"."stay_context"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "department_task" ADD CONSTRAINT "department_task_assignee_membership_id_staff_membership_id_fk" FOREIGN KEY ("assignee_membership_id") REFERENCES "public"."staff_membership"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "department_task" ADD CONSTRAINT "dept_task_parent_fk" FOREIGN KEY ("parent_task_id") REFERENCES "public"."department_task"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dining_menu_item" ADD CONSTRAINT "dining_menu_item_property_id_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."property"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dining_menu_item" ADD CONSTRAINT "dining_menu_item_outlet_id_outlet_id_fk" FOREIGN KEY ("outlet_id") REFERENCES "public"."outlet"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dining_order_item" ADD CONSTRAINT "dining_order_item_order_id_dining_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."dining_order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dining_order_item" ADD CONSTRAINT "dining_order_item_menu_item_id_dining_menu_item_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."dining_menu_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dining_order" ADD CONSTRAINT "dining_order_property_id_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."property"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dining_order" ADD CONSTRAINT "dining_order_stay_id_stay_context_id_fk" FOREIGN KEY ("stay_id") REFERENCES "public"."stay_context"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dining_order" ADD CONSTRAINT "dining_order_outlet_id_outlet_id_fk" FOREIGN KEY ("outlet_id") REFERENCES "public"."outlet"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dining_order" ADD CONSTRAINT "dining_order_related_task_id_department_task_id_fk" FOREIGN KEY ("related_task_id") REFERENCES "public"."department_task"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escalation" ADD CONSTRAINT "escalation_property_id_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."property"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escalation" ADD CONSTRAINT "escalation_task_id_department_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."department_task"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escalation" ADD CONSTRAINT "escalation_recipient_membership_id_staff_membership_id_fk" FOREIGN KEY ("recipient_membership_id") REFERENCES "public"."staff_membership"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_case" ADD CONSTRAINT "guest_case_property_id_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."property"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_case" ADD CONSTRAINT "guest_case_stay_id_stay_context_id_fk" FOREIGN KEY ("stay_id") REFERENCES "public"."stay_context"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_case" ADD CONSTRAINT "guest_case_room_id_room_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."room"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_case" ADD CONSTRAINT "guest_case_owner_membership_id_staff_membership_id_fk" FOREIGN KEY ("owner_membership_id") REFERENCES "public"."staff_membership"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incident_access" ADD CONSTRAINT "incident_access_incident_id_incident_id_fk" FOREIGN KEY ("incident_id") REFERENCES "public"."incident"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incident_access" ADD CONSTRAINT "incident_access_membership_id_staff_membership_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."staff_membership"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incident_access" ADD CONSTRAINT "incident_access_property_id_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."property"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incident_access" ADD CONSTRAINT "incident_access_approved_by_membership_id_staff_membership_id_fk" FOREIGN KEY ("approved_by_membership_id") REFERENCES "public"."staff_membership"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incident_action" ADD CONSTRAINT "incident_action_property_id_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."property"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incident_action" ADD CONSTRAINT "incident_action_incident_id_incident_id_fk" FOREIGN KEY ("incident_id") REFERENCES "public"."incident"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incident_action" ADD CONSTRAINT "incident_action_actor_membership_id_staff_membership_id_fk" FOREIGN KEY ("actor_membership_id") REFERENCES "public"."staff_membership"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incident_evidence" ADD CONSTRAINT "incident_evidence_incident_id_incident_id_fk" FOREIGN KEY ("incident_id") REFERENCES "public"."incident"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incident_evidence" ADD CONSTRAINT "incident_evidence_property_id_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."property"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incident_evidence" ADD CONSTRAINT "incident_evidence_recorded_by_membership_id_staff_membership_id_fk" FOREIGN KEY ("recorded_by_membership_id") REFERENCES "public"."staff_membership"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incident" ADD CONSTRAINT "incident_property_id_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."property"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incident" ADD CONSTRAINT "incident_case_id_guest_case_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."guest_case"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_asset" ADD CONSTRAINT "maintenance_asset_property_id_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."property"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_asset" ADD CONSTRAINT "maintenance_asset_department_id_department_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."department"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_handover" ADD CONSTRAINT "shift_handover_property_id_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."property"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_handover" ADD CONSTRAINT "shift_handover_department_id_department_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."department"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_handover" ADD CONSTRAINT "shift_handover_outgoing_shift_id_shift_id_fk" FOREIGN KEY ("outgoing_shift_id") REFERENCES "public"."shift"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_handover" ADD CONSTRAINT "shift_handover_incoming_shift_id_shift_id_fk" FOREIGN KEY ("incoming_shift_id") REFERENCES "public"."shift"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_handover" ADD CONSTRAINT "shift_handover_from_membership_id_staff_membership_id_fk" FOREIGN KEY ("from_membership_id") REFERENCES "public"."staff_membership"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_handover" ADD CONSTRAINT "shift_handover_next_owner_membership_id_staff_membership_id_fk" FOREIGN KEY ("next_owner_membership_id") REFERENCES "public"."staff_membership"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_handover" ADD CONSTRAINT "shift_handover_backup_membership_id_staff_membership_id_fk" FOREIGN KEY ("backup_membership_id") REFERENCES "public"."staff_membership"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sla_policy" ADD CONSTRAINT "sla_policy_property_id_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."property"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sla_policy" ADD CONSTRAINT "sla_policy_category_id_task_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."task_category"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supervisor_inspection" ADD CONSTRAINT "supervisor_inspection_property_id_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."property"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supervisor_inspection" ADD CONSTRAINT "supervisor_inspection_task_id_department_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."department_task"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supervisor_inspection" ADD CONSTRAINT "supervisor_inspection_room_id_room_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."room"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supervisor_inspection" ADD CONSTRAINT "supervisor_inspection_supervisor_membership_id_staff_membership_id_fk" FOREIGN KEY ("supervisor_membership_id") REFERENCES "public"."staff_membership"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_category" ADD CONSTRAINT "task_category_property_id_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."property"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_category" ADD CONSTRAINT "task_category_department_id_department_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."department"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_checklist_item" ADD CONSTRAINT "task_checklist_item_property_id_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."property"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_checklist_item" ADD CONSTRAINT "task_checklist_item_task_id_department_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."department_task"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_checklist_item" ADD CONSTRAINT "task_checklist_item_completed_by_membership_id_staff_membership_id_fk" FOREIGN KEY ("completed_by_membership_id") REFERENCES "public"."staff_membership"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_event" ADD CONSTRAINT "task_event_property_id_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."property"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_event" ADD CONSTRAINT "task_event_task_id_department_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."department_task"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_event" ADD CONSTRAINT "task_event_actor_membership_id_staff_membership_id_fk" FOREIGN KEY ("actor_membership_id") REFERENCES "public"."staff_membership"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wellness_booking" ADD CONSTRAINT "wellness_booking_property_id_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."property"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wellness_booking" ADD CONSTRAINT "wellness_booking_stay_id_stay_context_id_fk" FOREIGN KEY ("stay_id") REFERENCES "public"."stay_context"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachment" ADD CONSTRAINT "attachment_property_id_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."property"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachment" ADD CONSTRAINT "attachment_uploaded_by_membership_id_staff_membership_id_fk" FOREIGN KEY ("uploaded_by_membership_id") REFERENCES "public"."staff_membership"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emergency_broadcast" ADD CONSTRAINT "emergency_broadcast_property_id_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."property"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_approval" ADD CONSTRAINT "financial_approval_property_id_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."property"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_approval" ADD CONSTRAINT "financial_approval_exception_id_financial_exception_id_fk" FOREIGN KEY ("exception_id") REFERENCES "public"."financial_exception"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_approval" ADD CONSTRAINT "financial_approval_approver_membership_id_staff_membership_id_fk" FOREIGN KEY ("approver_membership_id") REFERENCES "public"."staff_membership"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_evidence" ADD CONSTRAINT "financial_evidence_exception_id_financial_exception_id_fk" FOREIGN KEY ("exception_id") REFERENCES "public"."financial_exception"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_evidence" ADD CONSTRAINT "financial_evidence_attachment_id_attachment_id_fk" FOREIGN KEY ("attachment_id") REFERENCES "public"."attachment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_evidence" ADD CONSTRAINT "financial_evidence_property_id_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."property"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_exception" ADD CONSTRAINT "financial_exception_property_id_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."property"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_exception" ADD CONSTRAINT "financial_exception_stay_id_stay_context_id_fk" FOREIGN KEY ("stay_id") REFERENCES "public"."stay_context"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_exception" ADD CONSTRAINT "financial_exception_requested_by_membership_id_staff_membership_id_fk" FOREIGN KEY ("requested_by_membership_id") REFERENCES "public"."staff_membership"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_execution" ADD CONSTRAINT "financial_execution_property_id_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."property"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_execution" ADD CONSTRAINT "financial_execution_approval_id_financial_approval_id_fk" FOREIGN KEY ("approval_id") REFERENCES "public"."financial_approval"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_execution" ADD CONSTRAINT "financial_execution_exception_id_financial_exception_id_fk" FOREIGN KEY ("exception_id") REFERENCES "public"."financial_exception"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_execution" ADD CONSTRAINT "financial_execution_executor_membership_id_staff_membership_id_fk" FOREIGN KEY ("executor_membership_id") REFERENCES "public"."staff_membership"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "folio_adjustment" ADD CONSTRAINT "folio_adjustment_property_id_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."property"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "folio_adjustment" ADD CONSTRAINT "folio_adjustment_stay_id_stay_context_id_fk" FOREIGN KEY ("stay_id") REFERENCES "public"."stay_context"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "folio_adjustment" ADD CONSTRAINT "folio_adjustment_posted_by_membership_id_staff_membership_id_fk" FOREIGN KEY ("posted_by_membership_id") REFERENCES "public"."staff_membership"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_feedback" ADD CONSTRAINT "guest_feedback_property_id_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."property"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_feedback" ADD CONSTRAINT "guest_feedback_stay_id_stay_context_id_fk" FOREIGN KEY ("stay_id") REFERENCES "public"."stay_context"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_reminder" ADD CONSTRAINT "guest_reminder_property_id_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."property"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_reminder" ADD CONSTRAINT "guest_reminder_stay_id_stay_context_id_fk" FOREIGN KEY ("stay_id") REFERENCES "public"."stay_context"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_session" ADD CONSTRAINT "guest_session_stay_id_stay_context_id_fk" FOREIGN KEY ("stay_id") REFERENCES "public"."stay_context"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_session" ADD CONSTRAINT "guest_session_room_id_room_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."room"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lost_found_item" ADD CONSTRAINT "lost_found_item_property_id_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."property"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lost_found_item" ADD CONSTRAINT "lost_found_item_stay_id_stay_context_id_fk" FOREIGN KEY ("stay_id") REFERENCES "public"."stay_context"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qr_mapping" ADD CONSTRAINT "qr_mapping_property_id_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."property"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qr_mapping" ADD CONSTRAINT "qr_mapping_room_id_room_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."room"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reconciliation" ADD CONSTRAINT "reconciliation_property_id_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."property"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reconciliation" ADD CONSTRAINT "reconciliation_execution_id_financial_execution_id_fk" FOREIGN KEY ("execution_id") REFERENCES "public"."financial_execution"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reconciliation" ADD CONSTRAINT "reconciliation_reviewer_membership_id_staff_membership_id_fk" FOREIGN KEY ("reviewer_membership_id") REFERENCES "public"."staff_membership"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_assignment" ADD CONSTRAINT "room_assignment_stay_id_stay_context_id_fk" FOREIGN KEY ("stay_id") REFERENCES "public"."stay_context"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_assignment" ADD CONSTRAINT "room_assignment_room_id_room_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."room"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_assignment" ADD CONSTRAINT "room_assignment_property_id_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."property"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stay_context" ADD CONSTRAINT "stay_context_property_id_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."property"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vip_directives" ADD CONSTRAINT "vip_directives_property_id_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."property"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_event_property_timeline_idx" ON "audit_event" USING btree ("property_id","occurred_at");--> statement-breakpoint
CREATE INDEX "connector_outbox_unsent_idx" ON "connector_outbox" USING btree ("property_id","available_at") WHERE "connector_outbox"."delivered_at" is null;--> statement-breakpoint
CREATE INDEX "profile_grant_active_idx" ON "profile_grant" USING btree ("property_id","membership_id","valid_from") WHERE "profile_grant"."revoked_at" is null;--> statement-breakpoint
CREATE INDEX "case_message_case_idx" ON "case_message" USING btree ("case_id","created_at");--> statement-breakpoint
CREATE INDEX "dept_task_queue_idx" ON "department_task" USING btree ("property_id","status","completion_due_at");--> statement-breakpoint
CREATE INDEX "dept_task_assignee_idx" ON "department_task" USING btree ("property_id","assignee_membership_id","status");--> statement-breakpoint
CREATE INDEX "dept_task_department_idx" ON "department_task" USING btree ("property_id","department_id","status");--> statement-breakpoint
CREATE INDEX "dept_task_room_idx" ON "department_task" USING btree ("room_id");--> statement-breakpoint
CREATE INDEX "dept_task_stay_idx" ON "department_task" USING btree ("stay_id");--> statement-breakpoint
CREATE INDEX "dining_menu_outlet_cat_idx" ON "dining_menu_item" USING btree ("outlet_id","category");--> statement-breakpoint
CREATE INDEX "dining_order_prop_status_idx" ON "dining_order" USING btree ("property_id","status");--> statement-breakpoint
CREATE INDEX "dining_order_stay_idx" ON "dining_order" USING btree ("stay_id");--> statement-breakpoint
CREATE INDEX "escalation_prop_status_idx" ON "escalation" USING btree ("property_id","delivery_status");--> statement-breakpoint
CREATE INDEX "guest_case_property_status_idx" ON "guest_case" USING btree ("property_id","status");--> statement-breakpoint
CREATE INDEX "guest_case_stay_idx" ON "guest_case" USING btree ("stay_id");--> statement-breakpoint
CREATE INDEX "incident_action_timeline_idx" ON "incident_action" USING btree ("incident_id","occurred_at");--> statement-breakpoint
CREATE INDEX "incident_prop_status_idx" ON "incident" USING btree ("property_id","status");--> statement-breakpoint
CREATE INDEX "maint_asset_prop_status_idx" ON "maintenance_asset" USING btree ("property_id","status");--> statement-breakpoint
CREATE INDEX "inspection_prop_status_idx" ON "supervisor_inspection" USING btree ("property_id","status");--> statement-breakpoint
CREATE INDEX "inspection_room_idx" ON "supervisor_inspection" USING btree ("room_id");--> statement-breakpoint
CREATE INDEX "checklist_task_idx" ON "task_checklist_item" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "task_event_task_timeline_idx" ON "task_event" USING btree ("task_id","occurred_at");--> statement-breakpoint
CREATE INDEX "wellness_stay_idx" ON "wellness_booking" USING btree ("stay_id");--> statement-breakpoint
CREATE INDEX "wellness_time_idx" ON "wellness_booking" USING btree ("start_time");--> statement-breakpoint
CREATE INDEX "attachment_prop_class_idx" ON "attachment" USING btree ("property_id","classification");--> statement-breakpoint
CREATE INDEX "emergency_broadcast_prop_status_idx" ON "emergency_broadcast" USING btree ("property_id","status");--> statement-breakpoint
CREATE INDEX "fin_approval_exception_idx" ON "financial_approval" USING btree ("exception_id");--> statement-breakpoint
CREATE INDEX "fin_exception_prop_status_idx" ON "financial_exception" USING btree ("property_id","status");--> statement-breakpoint
CREATE INDEX "fin_exception_stay_idx" ON "financial_exception" USING btree ("stay_id");--> statement-breakpoint
CREATE INDEX "folio_adj_stay_idx" ON "folio_adjustment" USING btree ("stay_id");--> statement-breakpoint
CREATE INDEX "guest_feedback_stay_idx" ON "guest_feedback" USING btree ("stay_id");--> statement-breakpoint
CREATE INDEX "guest_reminder_prop_status_idx" ON "guest_reminder" USING btree ("property_id","status");--> statement-breakpoint
CREATE INDEX "guest_reminder_alert_idx" ON "guest_reminder" USING btree ("alert_at");--> statement-breakpoint
CREATE INDEX "guest_session_token_idx" ON "guest_session" USING btree ("session_token");--> statement-breakpoint
CREATE INDEX "guest_session_stay_idx" ON "guest_session" USING btree ("stay_id");--> statement-breakpoint
CREATE INDEX "lost_found_prop_status_idx" ON "lost_found_item" USING btree ("property_id","status");--> statement-breakpoint
CREATE INDEX "qr_map_room_idx" ON "qr_mapping" USING btree ("room_id");--> statement-breakpoint
CREATE INDEX "qr_map_signature_idx" ON "qr_mapping" USING btree ("static_hmac_signature");--> statement-breakpoint
CREATE INDEX "room_assign_stay_idx" ON "room_assignment" USING btree ("stay_id");--> statement-breakpoint
CREATE INDEX "room_assign_room_idx" ON "room_assignment" USING btree ("room_id");--> statement-breakpoint
CREATE INDEX "room_assign_current_idx" ON "room_assignment" USING btree ("property_id","is_current");--> statement-breakpoint
CREATE INDEX "stay_property_status_idx" ON "stay_context" USING btree ("property_id","status");--> statement-breakpoint
CREATE INDEX "stay_booking_ref_idx" ON "stay_context" USING btree ("booking_reference");--> statement-breakpoint
CREATE INDEX "vip_directives_prop_active_idx" ON "vip_directives" USING btree ("property_id","active");
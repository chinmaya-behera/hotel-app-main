CREATE TABLE "staff_session" (
	"id" text PRIMARY KEY NOT NULL,
	"membership_id" text NOT NULL,
	"access_hash" text NOT NULL,
	"refresh_hash" text NOT NULL,
	"csrf_hash" text NOT NULL,
	"access_expires_at" timestamp with time zone NOT NULL,
	"refresh_expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "staff_session_access_hash_unique" UNIQUE("access_hash"),
	CONSTRAINT "staff_session_refresh_hash_unique" UNIQUE("refresh_hash"),
	CONSTRAINT "staff_session_expiry_order" CHECK ("staff_session"."access_expires_at" <= "staff_session"."refresh_expires_at")
);

--> statement-breakpoint
ALTER TABLE "staff_session" ADD CONSTRAINT "staff_session_membership_id_staff_membership_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."staff_membership"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "staff_session_membership_idx" ON "staff_session" USING btree ("membership_id");

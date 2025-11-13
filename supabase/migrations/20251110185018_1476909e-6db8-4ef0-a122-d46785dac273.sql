-- Add 'free' status to tenant_status enum
ALTER TYPE tenant_status ADD VALUE IF NOT EXISTS 'free';
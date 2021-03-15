DROP TABLE IF EXISTS public.advisor;

CREATE TABLE public.advisor (
    id varchar NOT NULL,
    -- attributes

    /* versioning */
    is_active boolean DEFAULT true NOT NULL,
    deleted smallint DEFAULT 0,

    /* timestamp tracking */
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),

    /* owner tracking */
    created_by varchar DEFAULT NULL,
    updated_by varchar DEFAULT NULL,

    PRIMARY KEY (id)
);

CREATE TRIGGER set_public_advisor_updated_at
BEFORE UPDATE ON public.advisor FOR EACH ROW
EXECUTE FUNCTION public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_advisor_updated_at ON public.advisor IS 'trigger to set value of column "updated_at" to current timestamp on row update';

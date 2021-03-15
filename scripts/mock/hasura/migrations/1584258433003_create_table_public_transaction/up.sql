DROP TABLE IF EXISTS public.transaction;

CREATE TABLE public.transaction (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    user_id varchar NOT NULL,
    advisor_id varchar NOT NULL,
    session_id varchar NOT NULL,

    -- attributes

    /* timestamp tracking */
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),

    /* owner tracking */
    created_by varchar DEFAULT NULL,
    updated_by varchar DEFAULT NULL,

    PRIMARY KEY (id),

    FOREIGN KEY (user_id) REFERENCES public.user(id) ON UPDATE RESTRICT ON DELETE cascade,
    FOREIGN KEY (advisor_id) REFERENCES public.advisor(id) ON UPDATE RESTRICT ON DELETE RESTRICT
);

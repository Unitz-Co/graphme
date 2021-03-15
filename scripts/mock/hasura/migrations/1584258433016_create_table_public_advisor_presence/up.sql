DROP TABLE IF EXISTS public.advisor_presence;

CREATE TABLE public.advisor_presence(
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    advisor_id varchar NOT NULL,

    status text NOT NULL,

    /* timestamp tracking */
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),

    /* owner tracking */
    created_by varchar DEFAULT NULL,
    updated_by varchar DEFAULT NULL,

    PRIMARY KEY (id),
    unique (advisor_id),

    FOREIGN KEY (advisor_id) REFERENCES public.advisor(id) ON UPDATE RESTRICT ON DELETE cascade
);

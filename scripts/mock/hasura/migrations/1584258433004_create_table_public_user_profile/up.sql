DROP TABLE IF EXISTS public.user_profile;

CREATE TABLE public.user_profile(
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    user_id varchar NOT NULL,

    display_name text NOT NULL,
    avatar_url text NOT NULL,

    /* timestamp tracking */
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),

    /* owner tracking */
    created_by varchar DEFAULT NULL,
    updated_by varchar DEFAULT NULL,

    PRIMARY KEY (id),
    unique (user_id),

    FOREIGN KEY (user_id) REFERENCES public.user(id) ON UPDATE RESTRICT ON DELETE cascade
);

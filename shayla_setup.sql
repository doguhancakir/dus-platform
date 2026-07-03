INSERT INTO public.branches (id, name, icon, color, sort_order)
VALUES (109, 'Shayla', '💻', '#0ea5e9', 9)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.topics (id, branch_id, title, sort_order)
VALUES (9109, 109, 'Loşimani', 0)
ON CONFLICT (id) DO NOTHING;

-- Seed Question Templates for State of Clarity
-- 10 categories x 5-6 questions each = 50-60 curated questions
-- Run this in Supabase SQL Editor after schema.sql

-- Clear existing templates (for re-seeding)
DELETE FROM public.question_templates;

-- Economy (6 questions, 2 featured)
INSERT INTO public.question_templates (category, question_text, is_featured, display_order) VALUES
('Economy', 'What is the current state of the UK economy and how does it compare to other G7 nations?', true, 1),
('Economy', 'How does the Bank of England determine interest rates and what factors influence their decisions?', true, 2),
('Economy', 'What are the main drivers of inflation in the UK and what policies can address them?', false, 3),
('Economy', 'How does Brexit continue to impact UK trade and economic growth?', false, 4),
('Economy', 'What is the current state of UK household debt and what are the implications?', false, 5),
('Economy', 'How does the UK tax system compare to other developed nations in terms of progressivity?', false, 6);

-- Healthcare (6 questions, 2 featured)
INSERT INTO public.question_templates (category, question_text, is_featured, display_order) VALUES
('Healthcare', 'What are the main challenges facing the NHS and what reforms are being proposed?', true, 1),
('Healthcare', 'How does UK healthcare spending compare to other developed countries?', true, 2),
('Healthcare', 'What is the current state of NHS waiting times and what solutions are being implemented?', false, 3),
('Healthcare', 'How is the UK addressing the shortage of healthcare workers?', false, 4),
('Healthcare', 'What role does private healthcare play in the UK system?', false, 5),
('Healthcare', 'How effective is mental health provision in the UK compared to physical health services?', false, 6);

-- Climate (6 questions, 2 featured)
INSERT INTO public.question_templates (category, question_text, is_featured, display_order) VALUES
('Climate', 'What are the UK''s net zero targets and is the country on track to meet them?', true, 1),
('Climate', 'How does the UK''s renewable energy transition compare to other European nations?', true, 2),
('Climate', 'What policies exist to help households reduce their carbon footprint?', false, 3),
('Climate', 'How is the UK addressing climate adaptation for coastal communities?', false, 4),
('Climate', 'What is the current state of electric vehicle adoption in the UK?', false, 5),
('Climate', 'How does carbon pricing work and what impact has it had on UK emissions?', false, 6);

-- Education (6 questions, 2 featured)
INSERT INTO public.question_templates (category, question_text, is_featured, display_order) VALUES
('Education', 'How does UK educational attainment compare to other OECD countries?', true, 1),
('Education', 'What is the current debate around grammar schools and selective education?', true, 2),
('Education', 'How has the UK addressed the impact of COVID-19 on student learning outcomes?', false, 3),
('Education', 'What is the state of vocational education and apprenticeships in the UK?', false, 4),
('Education', 'How are universities funded in the UK and what are the arguments around tuition fees?', false, 5),
('Education', 'What policies address the educational attainment gap between rich and poor students?', false, 6);

-- Defense (5 questions, 1 featured)
INSERT INTO public.question_templates (category, question_text, is_featured, display_order) VALUES
('Defense', 'What is the current state of UK defense spending and how does it compare to NATO allies?', true, 1),
('Defense', 'How is the UK modernizing its military capabilities for future conflicts?', false, 2),
('Defense', 'What is the UK''s nuclear deterrent policy and what are the arguments for and against Trident?', false, 3),
('Defense', 'How does the UK contribute to NATO operations and collective security?', false, 4),
('Defense', 'What is the current state of UK cyber defense capabilities?', false, 5);

-- Immigration (6 questions, 2 featured)
INSERT INTO public.question_templates (category, question_text, is_featured, display_order) VALUES
('Immigration', 'What are the current UK immigration policies and how have they changed since Brexit?', true, 1),
('Immigration', 'How does the UK points-based immigration system work?', true, 2),
('Immigration', 'What is the economic impact of immigration on the UK?', false, 3),
('Immigration', 'How is the UK handling asylum applications and what are the current backlogs?', false, 4),
('Immigration', 'What are the arguments for and against reducing net migration to the UK?', false, 5),
('Immigration', 'How does UK immigration policy compare to other European countries?', false, 6);

-- Housing (6 questions, 2 featured)
INSERT INTO public.question_templates (category, question_text, is_featured, display_order) VALUES
('Housing', 'What are the main factors driving the UK housing affordability crisis?', true, 1),
('Housing', 'How does the UK compare to other countries in terms of home ownership rates?', true, 2),
('Housing', 'What policies have been implemented to increase housing supply in the UK?', false, 3),
('Housing', 'How effective are rent controls and what are the arguments for and against them?', false, 4),
('Housing', 'What is the current state of social housing in the UK?', false, 5),
('Housing', 'How do planning regulations affect housing development in the UK?', false, 6);

-- Justice (5 questions, 1 featured)
INSERT INTO public.question_templates (category, question_text, is_featured, display_order) VALUES
('Justice', 'What are the main challenges facing the UK criminal justice system?', true, 1),
('Justice', 'How does the UK prison system compare to other developed nations?', false, 2),
('Justice', 'What is the current state of court backlogs and access to justice in the UK?', false, 3),
('Justice', 'How effective is rehabilitation in UK prisons at reducing reoffending?', false, 4),
('Justice', 'What are the arguments for and against police reform in the UK?', false, 5);

-- Technology (6 questions, 2 featured)
INSERT INTO public.question_templates (category, question_text, is_featured, display_order) VALUES
('Technology', 'How is the UK government regulating artificial intelligence?', true, 1),
('Technology', 'What is the UK''s strategy for becoming a global technology hub?', true, 2),
('Technology', 'How does the UK approach data privacy and protection compared to the EU?', false, 3),
('Technology', 'What policies support the UK tech startup ecosystem?', false, 4),
('Technology', 'How is the UK addressing the digital skills gap?', false, 5),
('Technology', 'What is the current state of broadband infrastructure in rural UK areas?', false, 6);

-- Governance (5 questions, 1 featured)
INSERT INTO public.question_templates (category, question_text, is_featured, display_order) VALUES
('Governance', 'How does the UK parliamentary system work and what are its strengths and weaknesses?', true, 1),
('Governance', 'What is the current state of devolution in Scotland, Wales, and Northern Ireland?', false, 2),
('Governance', 'How effective is the House of Lords and what are the arguments for reform?', false, 3),
('Governance', 'What are the arguments for and against proportional representation in UK elections?', false, 4),
('Governance', 'How does lobbying work in UK politics and what regulations exist?', false, 5);

-- Verify the count
-- SELECT category, COUNT(*) as count, SUM(CASE WHEN is_featured THEN 1 ELSE 0 END) as featured_count 
-- FROM public.question_templates 
-- GROUP BY category 
-- ORDER BY category;

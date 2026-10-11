-- Insertion en lot des categories manquantes pour OutilPro.
-- Idempotent : ON CONFLICT (slug) DO NOTHING ignore silencieusement toute
-- categorie dont le slug existe deja (ex: "Outillage electroportatif", deja en base),
-- donc ce script peut etre relance sans risque de doublon ni d'erreur.
--
-- Utilisation (depuis un terminal sur votre machine, avec les identifiants
-- de application.properties : spring.datasource.username/password) :
--   psql -h 127.0.0.1 -p 5435 -U outilpro -d outilpro -f seed-categories.sql
-- (mot de passe demande : celui de spring.datasource.password, "outilpro" en local)
--
-- imageUrl est laisse a NULL : la carte categorie (CategorieCard.jsx) affiche
-- un fond neutre avec le nom tant qu'aucune image n'est ajoutee. Vous pourrez
-- uploader une photo pour chacune plus tard depuis Espace Admin > Categories,
-- sans casser l'affichage entre-temps.

INSERT INTO categories (nom, slug, image_url) VALUES
    ('Outillage électroportatif', 'outillage-electroportatif', NULL),
    ('Accessoires',               'accessoires',               NULL),
    ('Outils à main',             'outils-a-main',              NULL),
    ('Outils de jardin',          'outils-de-jardin',           NULL),
    ('Outils de mesure',          'outils-de-mesure',           NULL),
    ('Outils de sécurité',        'outils-de-securite',         NULL),
    ('Poste à souder',            'poste-a-souder',             NULL),
    ('Outillages pneumatiques',   'outillages-pneumatiques',    NULL),
    ('Outils Sans Fil',           'outils-sans-fil',            NULL),
    ('Packs',                     'packs',                      NULL),
    ('Flash Promos',              'flash-promos',               NULL),
    ('Pompes à eau',              'pompes-a-eau',                NULL)
ON CONFLICT (slug) DO NOTHING;

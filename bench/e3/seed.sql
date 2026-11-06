--
-- PostgreSQL database dump
--

\restrict e43bHg1rmzsVS9z9YnjRCHzOjuCdaxzFMUnu15OvXIJe4wI5Kfc3bxCk0MX0tE2

-- Dumped from database version 15.19
-- Dumped by pg_dump version 15.19

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.inventory_records DROP CONSTRAINT IF EXISTS "inventory_records_campaignId_fkey";
ALTER TABLE IF EXISTS ONLY public."Transfer" DROP CONSTRAINT IF EXISTS "Transfer_assetId_fkey";
ALTER TABLE IF EXISTS ONLY public."Movement" DROP CONSTRAINT IF EXISTS "Movement_assetId_fkey";
ALTER TABLE IF EXISTS ONLY public."MaintenanceReport" DROP CONSTRAINT IF EXISTS "MaintenanceReport_assetId_fkey";
ALTER TABLE IF EXISTS ONLY app.inventory_records DROP CONSTRAINT IF EXISTS "inventory_records_campaignId_fkey";
ALTER TABLE IF EXISTS ONLY app."Transfer" DROP CONSTRAINT IF EXISTS "Transfer_assetId_fkey";
ALTER TABLE IF EXISTS ONLY app."Movement" DROP CONSTRAINT IF EXISTS "Movement_assetId_fkey";
ALTER TABLE IF EXISTS ONLY app."MaintenanceReport" DROP CONSTRAINT IF EXISTS "MaintenanceReport_assetId_fkey";
DROP INDEX IF EXISTS public."inventory_records_campaignId_assetId_key";
DROP INDEX IF EXISTS public."User_username_key";
DROP INDEX IF EXISTS public."User_ci_key";
DROP INDEX IF EXISTS public."Baja_assetId_key";
DROP INDEX IF EXISTS public."Asset_qrCode_key";
DROP INDEX IF EXISTS app."inventory_records_campaignId_assetId_key";
DROP INDEX IF EXISTS app."User_username_key";
DROP INDEX IF EXISTS app."User_ci_key";
DROP INDEX IF EXISTS app."Baja_assetId_key";
DROP INDEX IF EXISTS app."Asset_qrCode_key";
ALTER TABLE IF EXISTS ONLY public.inventory_records DROP CONSTRAINT IF EXISTS inventory_records_pkey;
ALTER TABLE IF EXISTS ONLY public.inventory_campaigns DROP CONSTRAINT IF EXISTS inventory_campaigns_pkey;
ALTER TABLE IF EXISTS ONLY public."User" DROP CONSTRAINT IF EXISTS "User_pkey";
ALTER TABLE IF EXISTS ONLY public."Transfer" DROP CONSTRAINT IF EXISTS "Transfer_pkey";
ALTER TABLE IF EXISTS ONLY public."Movement" DROP CONSTRAINT IF EXISTS "Movement_pkey";
ALTER TABLE IF EXISTS ONLY public."MaintenanceReport" DROP CONSTRAINT IF EXISTS "MaintenanceReport_pkey";
ALTER TABLE IF EXISTS ONLY public."Baja" DROP CONSTRAINT IF EXISTS "Baja_pkey";
ALTER TABLE IF EXISTS ONLY public."Assignment" DROP CONSTRAINT IF EXISTS "Assignment_pkey";
ALTER TABLE IF EXISTS ONLY public."Asset" DROP CONSTRAINT IF EXISTS "Asset_pkey";
ALTER TABLE IF EXISTS ONLY public."AI_CONVERSATIONS" DROP CONSTRAINT IF EXISTS "AI_CONVERSATIONS_pkey";
ALTER TABLE IF EXISTS ONLY app.inventory_records DROP CONSTRAINT IF EXISTS inventory_records_pkey;
ALTER TABLE IF EXISTS ONLY app.inventory_campaigns DROP CONSTRAINT IF EXISTS inventory_campaigns_pkey;
ALTER TABLE IF EXISTS ONLY app."User" DROP CONSTRAINT IF EXISTS "User_pkey";
ALTER TABLE IF EXISTS ONLY app."Transfer" DROP CONSTRAINT IF EXISTS "Transfer_pkey";
ALTER TABLE IF EXISTS ONLY app."Movement" DROP CONSTRAINT IF EXISTS "Movement_pkey";
ALTER TABLE IF EXISTS ONLY app."MaintenanceReport" DROP CONSTRAINT IF EXISTS "MaintenanceReport_pkey";
ALTER TABLE IF EXISTS ONLY app."Baja" DROP CONSTRAINT IF EXISTS "Baja_pkey";
ALTER TABLE IF EXISTS ONLY app."Assignment" DROP CONSTRAINT IF EXISTS "Assignment_pkey";
ALTER TABLE IF EXISTS ONLY app."Asset" DROP CONSTRAINT IF EXISTS "Asset_pkey";
ALTER TABLE IF EXISTS ONLY app."AI_CONVERSATIONS" DROP CONSTRAINT IF EXISTS "AI_CONVERSATIONS_pkey";
DROP TABLE IF EXISTS public.inventory_records;
DROP TABLE IF EXISTS public.inventory_campaigns;
DROP TABLE IF EXISTS public."User";
DROP TABLE IF EXISTS public."Transfer";
DROP TABLE IF EXISTS public."Movement";
DROP TABLE IF EXISTS public."MaintenanceReport";
DROP TABLE IF EXISTS public."Baja";
DROP TABLE IF EXISTS public."Assignment";
DROP TABLE IF EXISTS public."Asset";
DROP TABLE IF EXISTS public."AI_CONVERSATIONS";
DROP TABLE IF EXISTS app.inventory_records;
DROP TABLE IF EXISTS app.inventory_campaigns;
DROP TABLE IF EXISTS app."User";
DROP TABLE IF EXISTS app."Transfer";
DROP TABLE IF EXISTS app."Movement";
DROP TABLE IF EXISTS app."MaintenanceReport";
DROP TABLE IF EXISTS app."Baja";
DROP TABLE IF EXISTS app."Assignment";
DROP TABLE IF EXISTS app."Asset";
DROP TABLE IF EXISTS app."AI_CONVERSATIONS";
DROP SCHEMA IF EXISTS app;
--
-- Name: app; Type: SCHEMA; Schema: -; Owner: admin
--

CREATE SCHEMA app;


ALTER SCHEMA app OWNER TO admin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: AI_CONVERSATIONS; Type: TABLE; Schema: app; Owner: admin
--

CREATE TABLE app."AI_CONVERSATIONS" (
    id text NOT NULL,
    usuario_id text NOT NULL,
    pregunta text NOT NULL,
    respuesta text NOT NULL,
    tool_utilizada text,
    parametros_tool text,
    fecha timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    duracion integer NOT NULL
);


ALTER TABLE app."AI_CONVERSATIONS" OWNER TO admin;

--
-- Name: Asset; Type: TABLE; Schema: app; Owner: admin
--

CREATE TABLE app."Asset" (
    id text NOT NULL,
    "qrCode" text NOT NULL,
    name text NOT NULL,
    status text NOT NULL,
    location text NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    category text NOT NULL,
    "usefulLife" integer,
    origin text NOT NULL,
    "purchaseDate" timestamp(3) without time zone NOT NULL,
    "entryDate" timestamp(3) without time zone NOT NULL,
    "purchaseValue" double precision NOT NULL,
    "warrantyMonths" integer,
    "providerName" text,
    "providerNit" text,
    "providerPhone" text
);


ALTER TABLE app."Asset" OWNER TO admin;

--
-- Name: Assignment; Type: TABLE; Schema: app; Owner: admin
--

CREATE TABLE app."Assignment" (
    id text NOT NULL,
    "assetId" text NOT NULL,
    responsible text NOT NULL,
    date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    destination text NOT NULL,
    observations text
);


ALTER TABLE app."Assignment" OWNER TO admin;

--
-- Name: Baja; Type: TABLE; Schema: app; Owner: admin
--

CREATE TABLE app."Baja" (
    id text NOT NULL,
    "assetId" text NOT NULL,
    "jefeId" text NOT NULL,
    justification text NOT NULL,
    evidence text NOT NULL,
    "initiatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status text DEFAULT 'Iniciada'::text NOT NULL
);


ALTER TABLE app."Baja" OWNER TO admin;

--
-- Name: MaintenanceReport; Type: TABLE; Schema: app; Owner: admin
--

CREATE TABLE app."MaintenanceReport" (
    id text NOT NULL,
    "assetId" text NOT NULL,
    diagnosis text NOT NULL,
    "estimatedCost" double precision NOT NULL,
    action text NOT NULL,
    "inspectedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE app."MaintenanceReport" OWNER TO admin;

--
-- Name: Movement; Type: TABLE; Schema: app; Owner: admin
--

CREATE TABLE app."Movement" (
    id text NOT NULL,
    "assetId" text NOT NULL,
    latitude double precision NOT NULL,
    longitude double precision NOT NULL,
    "scannedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE app."Movement" OWNER TO admin;

--
-- Name: Transfer; Type: TABLE; Schema: app; Owner: admin
--

CREATE TABLE app."Transfer" (
    id text NOT NULL,
    "assetId" text NOT NULL,
    "fromUnit" text NOT NULL,
    "fromResponsible" text NOT NULL,
    "toUnit" text NOT NULL,
    "toResponsible" text NOT NULL,
    date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status text NOT NULL,
    reason text NOT NULL
);


ALTER TABLE app."Transfer" OWNER TO admin;

--
-- Name: User; Type: TABLE; Schema: app; Owner: admin
--

CREATE TABLE app."User" (
    id text NOT NULL,
    "fullName" text NOT NULL,
    ci text NOT NULL,
    phone text NOT NULL,
    role text NOT NULL,
    username text NOT NULL,
    cargo text,
    password text
);


ALTER TABLE app."User" OWNER TO admin;

--
-- Name: inventory_campaigns; Type: TABLE; Schema: app; Owner: admin
--

CREATE TABLE app.inventory_campaigns (
    id text NOT NULL,
    name text NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE app.inventory_campaigns OWNER TO admin;

--
-- Name: inventory_records; Type: TABLE; Schema: app; Owner: admin
--

CREATE TABLE app.inventory_records (
    id text NOT NULL,
    "campaignId" text NOT NULL,
    "assetId" text NOT NULL,
    "userId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE app.inventory_records OWNER TO admin;

--
-- Name: AI_CONVERSATIONS; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."AI_CONVERSATIONS" (
    id text NOT NULL,
    usuario_id text NOT NULL,
    pregunta text NOT NULL,
    respuesta text NOT NULL,
    tool_utilizada text,
    parametros_tool text,
    fecha timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    duracion integer NOT NULL
);


ALTER TABLE public."AI_CONVERSATIONS" OWNER TO admin;

--
-- Name: Asset; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."Asset" (
    id text NOT NULL,
    "qrCode" text NOT NULL,
    name text NOT NULL,
    status text NOT NULL,
    location text NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    category text NOT NULL,
    "usefulLife" integer,
    origin text NOT NULL,
    "purchaseDate" timestamp(3) without time zone NOT NULL,
    "entryDate" timestamp(3) without time zone NOT NULL,
    "purchaseValue" double precision NOT NULL,
    "warrantyMonths" integer,
    "providerName" text,
    "providerNit" text,
    "providerPhone" text
);


ALTER TABLE public."Asset" OWNER TO admin;

--
-- Name: Assignment; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."Assignment" (
    id text NOT NULL,
    "assetId" text NOT NULL,
    responsible text NOT NULL,
    date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    destination text NOT NULL,
    observations text
);


ALTER TABLE public."Assignment" OWNER TO admin;

--
-- Name: Baja; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."Baja" (
    id text NOT NULL,
    "assetId" text NOT NULL,
    "jefeId" text NOT NULL,
    justification text NOT NULL,
    evidence text NOT NULL,
    "initiatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status text DEFAULT 'Iniciada'::text NOT NULL
);


ALTER TABLE public."Baja" OWNER TO admin;

--
-- Name: MaintenanceReport; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."MaintenanceReport" (
    id text NOT NULL,
    "assetId" text NOT NULL,
    diagnosis text NOT NULL,
    "estimatedCost" double precision NOT NULL,
    action text NOT NULL,
    "inspectedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."MaintenanceReport" OWNER TO admin;

--
-- Name: Movement; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."Movement" (
    id text NOT NULL,
    "assetId" text NOT NULL,
    latitude double precision NOT NULL,
    longitude double precision NOT NULL,
    "scannedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Movement" OWNER TO admin;

--
-- Name: Transfer; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."Transfer" (
    id text NOT NULL,
    "assetId" text NOT NULL,
    "fromUnit" text NOT NULL,
    "fromResponsible" text NOT NULL,
    "toUnit" text NOT NULL,
    "toResponsible" text NOT NULL,
    date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status text NOT NULL,
    reason text NOT NULL
);


ALTER TABLE public."Transfer" OWNER TO admin;

--
-- Name: User; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."User" (
    id text NOT NULL,
    "fullName" text NOT NULL,
    ci text NOT NULL,
    phone text NOT NULL,
    role text NOT NULL,
    username text NOT NULL,
    cargo text,
    password text
);


ALTER TABLE public."User" OWNER TO admin;

--
-- Name: inventory_campaigns; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.inventory_campaigns (
    id text NOT NULL,
    name text NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.inventory_campaigns OWNER TO admin;

--
-- Name: inventory_records; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.inventory_records (
    id text NOT NULL,
    "campaignId" text NOT NULL,
    "assetId" text NOT NULL,
    "userId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.inventory_records OWNER TO admin;

--
-- Data for Name: AI_CONVERSATIONS; Type: TABLE DATA; Schema: app; Owner: admin
--

COPY app."AI_CONVERSATIONS" (id, usuario_id, pregunta, respuesta, tool_utilizada, parametros_tool, fecha, duracion) FROM stdin;
\.


--
-- Data for Name: Asset; Type: TABLE DATA; Schema: app; Owner: admin
--

COPY app."Asset" (id, "qrCode", name, status, location, "updatedAt", category, "usefulLife", origin, "purchaseDate", "entryDate", "purchaseValue", "warrantyMonths", "providerName", "providerNit", "providerPhone") FROM stdin;
15b6a42d-8ccd-4d55-9d0b-7aef893982ab	ACT-2026-001	Servidor Rack Dell PowerEdge R750 Xeon 32GB	Asignado	Centro de C├│mputo - Facultad de Tecnolog├¡a	2026-11-06 19:12:52.704	Sistemas/TI	5	Compra	2024-03-15 08:00:00	2024-03-20 08:00:00	28500	36	Dell Bolivia SRL	1020304025	22446688
2f898905-58f7-4f1e-93b9-226dcc8a479b	ACT-2026-002	Proyector Epson PowerLite L520U L├íser WUXGA	Nuevo	Aula Magna - Facultad de Medicina	2026-11-06 19:12:52.748	Equipos de Oficina	4	Compra	2025-06-10 08:00:00	2025-06-15 08:00:00	9800	24	Importadora Electr├│nica S.A.	1020498711	44252525
0d3cde32-48b1-4cca-88ae-ecaa8ae60282	ACT-2026-003	Escritorio Ejecutivo en L de Madera Roble con Cajonera	Asignado	Decanato - Facultad de Ciencias Econ├│micas	2026-11-06 19:12:52.785	Muebles y Enseres	10	Compra	2022-01-10 08:00:00	2022-01-15 08:00:00	3500	12	Muebles Finos El Arce	150493022	44521234
c9781967-abeb-4025-a4be-75a5355c1b1e	ACT-2026-004	Camioneta Toyota Hilux Double Cab 4x4 Modelo 2023	Asignado	Departamento de Mantenimiento y Servicios	2026-11-06 19:12:52.814	Veh├¡culos	5	Compra	2023-08-20 08:00:00	2023-08-25 08:00:00	245000	60	Toyosa S.A.	101230492	44919000
b2ec653d-7961-4b11-a547-a8b1f4ac82fb	ACT-2026-005	Fotocopiadora Industrial Ricoh Pro C5300s Color	Da├▒ado	Imprenta Universitaria - Campus Central	2026-11-06 19:12:52.851	Equipos de Oficina	5	Compra	2023-02-12 08:00:00	2023-02-18 08:00:00	68000	12	Ricoh Bolivia Distribuidores	120938401	22149500
eecf04c3-2bb3-441c-b702-ff670e98d79b	ACT-2026-006	Laptop Lenovo ThinkPad L14 Gen 4 Ryzen 7 16GB	Asignado	Direcci├│n de Planificaci├│n - Rectorado	2026-11-06 19:12:52.913	Sistemas/TI	4	Compra	2025-01-20 08:00:00	2025-01-22 08:00:00	7200	12	Sisteco S.A.	102049021	44589000
5ddd499b-823b-41f9-a34f-097888f9019e	ACT-2026-007	Impresora Multifuncional HP LaserJet Pro M428dw	Obsoleto	Secretar├¡a General - Facultad de Humanidades	2026-11-06 19:12:53.052	Equipos de Oficina	3	Compra	2021-05-14 08:00:00	2021-05-18 08:00:00	2500	12	HP Store Bolivia	109823471	33498000
e59ba161-da50-441e-b7a7-5787771ae87f	ACT-2026-008	Microscopio ├ôptico Binocular Zeiss Primo Star 3	Asignado	Laboratorio de Microbiolog├¡a - Bioqu├¡mica	2026-11-06 19:12:53.095	Maquinaria	8	Donaci├│n	2024-11-05 08:00:00	2024-11-10 08:00:00	14500	24	Embajada de Alemania (Donaci├│n)	N/A	N/A
\.


--
-- Data for Name: Assignment; Type: TABLE DATA; Schema: app; Owner: admin
--

COPY app."Assignment" (id, "assetId", responsible, date, destination, observations) FROM stdin;
6d328b7e-2f22-4b90-a5ba-057a6e8a5e1a	15b6a42d-8ccd-4d55-9d0b-7aef893982ab	Ing. Fernando Siles (Director TI)	2026-11-06 19:12:53.311	Servidores centralizados de la Facultad de Tecnolog├¡a	Requiere monitoreo continuo de temperatura.
9c014ca0-41bd-4644-aa89-68730f4f9dbf	c9781967-abeb-4025-a4be-75a5355c1b1e	Sr. Mario Rojas (Chofer Mantenimiento)	2026-11-06 19:12:53.349	Predios universitarios y facultades desconcentradas	Uso exclusivo para traslado de personal t├®cnico y herramientas.
\.


--
-- Data for Name: Baja; Type: TABLE DATA; Schema: app; Owner: admin
--

COPY app."Baja" (id, "assetId", "jefeId", justification, evidence, "initiatedAt", status) FROM stdin;
314c23d4-567a-4b24-aad3-810f56f09b45	5ddd499b-823b-41f9-a34f-097888f9019e	5820225c-303c-4f26-8640-6b2e1d0eafd6	Obsolescencia tecnol├│gica y costo de reparaci├│n elevado por desgaste de componentes internos principales.	informe_tecnico_hp428.pdf	2026-06-25 16:00:00	Iniciada
56dd64fc-212c-47ee-9057-263dead519d5	b2ec653d-7961-4b11-a547-a8b1f4ac82fb	5820225c-303c-4f26-8640-6b2e1d0eafd6	Inutilidad por da├▒o irreparable en la placa principal tras corte el├®ctrico en el predio universitario.	acta_siniestro_ricoh.pdf	2026-05-10 10:00:00	Aprobada
\.


--
-- Data for Name: MaintenanceReport; Type: TABLE DATA; Schema: app; Owner: admin
--

COPY app."MaintenanceReport" (id, "assetId", diagnosis, "estimatedCost", action, "inspectedAt") FROM stdin;
\.


--
-- Data for Name: Movement; Type: TABLE DATA; Schema: app; Owner: admin
--

COPY app."Movement" (id, "assetId", latitude, longitude, "scannedAt") FROM stdin;
\.


--
-- Data for Name: Transfer; Type: TABLE DATA; Schema: app; Owner: admin
--

COPY app."Transfer" (id, "assetId", "fromUnit", "fromResponsible", "toUnit", "toResponsible", date, status, reason) FROM stdin;
e042634f-cb65-492c-ae1f-2d8937230444	eecf04c3-2bb3-441c-b702-ff670e98d79b	Facultad de Tecnolog├¡a	Ing. Carlos Mendez	Rectorado	Lic. Laura Ter├ín	2026-02-10 14:30:00	Aprobada	Requerido para el plan de infraestructura y acreditaci├│n institucional.
8a227470-bc27-403d-a78d-030970fb9282	2f898905-58f7-4f1e-93b9-226dcc8a479b	Almac├®n Central	Ramiro Mendoza Gonzales	Facultad de Medicina	Dra. Patricia Solares	2026-07-01 09:15:00	Pendiente	Solicitud formal para equipamiento de aula de posgrados.
3f04ab0f-e91f-468e-bf36-58a81b8542f9	0d3cde32-48b1-4cca-88ae-ecaa8ae60282	Facultad de Humanidades	Lic. Andr├®s Torrico	Facultad de Ciencias Econ├│micas	Dr. Hugo Zeballos	2026-05-15 11:00:00	Rechazada	El activo se encuentra catalogado como de uso exclusivo y cr├¡tico para el ├írea de acreditaci├│n actual.
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: app; Owner: admin
--

COPY app."User" (id, "fullName", ci, phone, role, username, cargo, password) FROM stdin;
5820225c-303c-4f26-8640-6b2e1d0eafd6	Ramiro Mendoza Gonzales	4567890-CB	71234567	Administrador	admin	Jefe de Activos Fijos	\N
8d975614-53aa-4e6c-9a7e-8212ce384bb8	Maria Elena Prado	7891230-LP	60123456	Supervisor	mprado	Encargada de Inventario	\N
\.


--
-- Data for Name: inventory_campaigns; Type: TABLE DATA; Schema: app; Owner: admin
--

COPY app.inventory_campaigns (id, name, "startDate", "endDate", "createdAt") FROM stdin;
\.


--
-- Data for Name: inventory_records; Type: TABLE DATA; Schema: app; Owner: admin
--

COPY app.inventory_records (id, "campaignId", "assetId", "userId", "createdAt") FROM stdin;
\.


--
-- Data for Name: AI_CONVERSATIONS; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."AI_CONVERSATIONS" (id, usuario_id, pregunta, respuesta, tool_utilizada, parametros_tool, fecha, duracion) FROM stdin;
\.


--
-- Data for Name: Asset; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."Asset" (id, "qrCode", name, status, location, "updatedAt", category, "usefulLife", origin, "purchaseDate", "entryDate", "purchaseValue", "warrantyMonths", "providerName", "providerNit", "providerPhone") FROM stdin;
e651fa14-6890-4995-8995-b37a5ebb6205	ACT-2026-001	Servidor Rack Dell PowerEdge R750 Xeon 32GB	Asignado	Centro de CÔö£Ôöémputo - Facultad de TecnologÔö£┬ía	2026-11-06 18:58:10.709	Sistemas/TI	5	Compra	2024-03-15 08:00:00	2024-03-20 08:00:00	28500	36	Dell Bolivia SRL	1020304025	22446688
07b44b95-7020-48f2-9f21-acc08a747e44	ACT-2026-002	Proyector Epson PowerLite L520U LÔö£├¡ser WUXGA	Nuevo	Aula Magna - Facultad de Medicina	2026-11-06 18:58:10.83	Equipos de Oficina	4	Compra	2025-06-10 08:00:00	2025-06-15 08:00:00	9800	24	Importadora ElectrÔö£Ôöénica S.A.	1020498711	44252525
60903270-45a6-41d0-ab57-0f6204335151	ACT-2026-003	Escritorio Ejecutivo en L de Madera Roble con Cajonera	Asignado	Decanato - Facultad de Ciencias EconÔö£Ôöémicas	2026-11-06 18:58:10.916	Muebles y Enseres	10	Compra	2022-01-10 08:00:00	2022-01-15 08:00:00	3500	12	Muebles Finos El Arce	150493022	44521234
60118b79-0377-4ea4-bcba-6fb0cbb57dd6	ACT-2026-004	Camioneta Toyota Hilux Double Cab 4x4 Modelo 2023	Asignado	Departamento de Mantenimiento y Servicios	2026-11-06 18:58:11.12	VehÔö£┬ículos	5	Compra	2023-08-20 08:00:00	2023-08-25 08:00:00	245000	60	Toyosa S.A.	101230492	44919000
73fa66aa-ac80-44d8-b37a-ae913a6db695	ACT-2026-005	Fotocopiadora Industrial Ricoh Pro C5300s Color	DaÔö£ÔûÆado	Imprenta Universitaria - Campus Central	2026-11-06 18:58:11.356	Equipos de Oficina	5	Compra	2023-02-12 08:00:00	2023-02-18 08:00:00	68000	12	Ricoh Bolivia Distribuidores	120938401	22149500
9cd3833b-04f3-4cd6-8598-500410719c4a	ACT-2026-006	Laptop Lenovo ThinkPad L14 Gen 4 Ryzen 7 16GB	Asignado	DirecciÔö£Ôöén de PlanificaciÔö£Ôöén - Rectorado	2026-11-06 18:58:11.734	Sistemas/TI	4	Compra	2025-01-20 08:00:00	2025-01-22 08:00:00	7200	12	Sisteco S.A.	102049021	44589000
a40135e6-e7b5-47a8-9d04-3db5ff8cbb17	ACT-2026-007	Impresora Multifuncional HP LaserJet Pro M428dw	Obsoleto	SecretarÔö£┬ía General - Facultad de Humanidades	2026-11-06 18:58:11.801	Equipos de Oficina	3	Compra	2021-05-14 08:00:00	2021-05-18 08:00:00	2500	12	HP Store Bolivia	109823471	33498000
35898855-756c-4299-934b-38cd1a36dcc2	ACT-2026-008	Microscopio Ôö£├┤ptico Binocular Zeiss Primo Star 3	Asignado	Laboratorio de MicrobiologÔö£┬ía - BioquÔö£┬ímica	2026-11-06 18:58:11.869	Maquinaria	8	DonaciÔö£Ôöén	2024-11-05 08:00:00	2024-11-10 08:00:00	14500	24	Embajada de Alemania (DonaciÔö£Ôöén)	N/A	N/A
\.


--
-- Data for Name: Assignment; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."Assignment" (id, "assetId", responsible, date, destination, observations) FROM stdin;
d8fa7e54-d941-479b-8b57-9470ecda4228	e651fa14-6890-4995-8995-b37a5ebb6205	Ing. Fernando Siles (Director TI)	2026-11-06 18:58:12.838	Servidores centralizados de la Facultad de TecnologÔö£┬ía	Requiere monitoreo continuo de temperatura.
7709998f-3990-43f5-8d77-acbc7f563d90	60118b79-0377-4ea4-bcba-6fb0cbb57dd6	Sr. Mario Rojas (Chofer Mantenimiento)	2026-11-06 18:58:12.967	Predios universitarios y facultades desconcentradas	Uso exclusivo para traslado de personal tÔö£┬«cnico y herramientas.
\.


--
-- Data for Name: Baja; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."Baja" (id, "assetId", "jefeId", justification, evidence, "initiatedAt", status) FROM stdin;
90118f13-aa45-46b1-895c-a68dc0e6c28d	a40135e6-e7b5-47a8-9d04-3db5ff8cbb17	489dd234-ff4b-455b-89b0-d5fe6c020eac	Obsolescencia tecnolÔö£Ôöégica y costo de reparaciÔö£Ôöén elevado por desgaste de componentes internos principales.	informe_tecnico_hp428.pdf	2026-06-25 16:00:00	Iniciada
d3abe89a-edcf-4a75-9b55-f53de9a31c29	73fa66aa-ac80-44d8-b37a-ae913a6db695	489dd234-ff4b-455b-89b0-d5fe6c020eac	Inutilidad por daÔö£ÔûÆo irreparable en la placa principal tras corte elÔö£┬«ctrico en el predio universitario.	acta_siniestro_ricoh.pdf	2026-05-10 10:00:00	Aprobada
\.


--
-- Data for Name: MaintenanceReport; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."MaintenanceReport" (id, "assetId", diagnosis, "estimatedCost", action, "inspectedAt") FROM stdin;
\.


--
-- Data for Name: Movement; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."Movement" (id, "assetId", latitude, longitude, "scannedAt") FROM stdin;
\.


--
-- Data for Name: Transfer; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."Transfer" (id, "assetId", "fromUnit", "fromResponsible", "toUnit", "toResponsible", date, status, reason) FROM stdin;
f02da289-d352-4127-a64f-cbf340ce7da4	9cd3833b-04f3-4cd6-8598-500410719c4a	Facultad de TecnologÔö£┬ía	Ing. Carlos Mendez	Rectorado	Lic. Laura TerÔö£├¡n	2026-02-10 14:30:00	Aprobada	Requerido para el plan de infraestructura y acreditaciÔö£Ôöén institucional.
73faa4be-ba9c-4a69-b31a-35771cf5eb1e	07b44b95-7020-48f2-9f21-acc08a747e44	AlmacÔö£┬«n Central	Ramiro Mendoza Gonzales	Facultad de Medicina	Dra. Patricia Solares	2026-07-01 09:15:00	Pendiente	Solicitud formal para equipamiento de aula de posgrados.
6feeee77-760a-4076-a695-27e1f77a67f1	60903270-45a6-41d0-ab57-0f6204335151	Facultad de Humanidades	Lic. AndrÔö£┬«s Torrico	Facultad de Ciencias EconÔö£Ôöémicas	Dr. Hugo Zeballos	2026-05-15 11:00:00	Rechazada	El activo se encuentra catalogado como de uso exclusivo y crÔö£┬ítico para el Ôö£├¡rea de acreditaciÔö£Ôöén actual.
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."User" (id, "fullName", ci, phone, role, username, cargo, password) FROM stdin;
489dd234-ff4b-455b-89b0-d5fe6c020eac	Ramiro Mendoza Gonzales	4567890-CB	71234567	Administrador	admin	Jefe de Activos Fijos	\N
cf065397-7acd-4701-9263-aa043f7648a4	Maria Elena Prado	7891230-LP	60123456	Supervisor	mprado	Encargada de Inventario	\N
\.


--
-- Data for Name: inventory_campaigns; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.inventory_campaigns (id, name, "startDate", "endDate", "createdAt") FROM stdin;
\.


--
-- Data for Name: inventory_records; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.inventory_records (id, "campaignId", "assetId", "userId", "createdAt") FROM stdin;
\.


--
-- Name: AI_CONVERSATIONS AI_CONVERSATIONS_pkey; Type: CONSTRAINT; Schema: app; Owner: admin
--

ALTER TABLE ONLY app."AI_CONVERSATIONS"
    ADD CONSTRAINT "AI_CONVERSATIONS_pkey" PRIMARY KEY (id);


--
-- Name: Asset Asset_pkey; Type: CONSTRAINT; Schema: app; Owner: admin
--

ALTER TABLE ONLY app."Asset"
    ADD CONSTRAINT "Asset_pkey" PRIMARY KEY (id);


--
-- Name: Assignment Assignment_pkey; Type: CONSTRAINT; Schema: app; Owner: admin
--

ALTER TABLE ONLY app."Assignment"
    ADD CONSTRAINT "Assignment_pkey" PRIMARY KEY (id);


--
-- Name: Baja Baja_pkey; Type: CONSTRAINT; Schema: app; Owner: admin
--

ALTER TABLE ONLY app."Baja"
    ADD CONSTRAINT "Baja_pkey" PRIMARY KEY (id);


--
-- Name: MaintenanceReport MaintenanceReport_pkey; Type: CONSTRAINT; Schema: app; Owner: admin
--

ALTER TABLE ONLY app."MaintenanceReport"
    ADD CONSTRAINT "MaintenanceReport_pkey" PRIMARY KEY (id);


--
-- Name: Movement Movement_pkey; Type: CONSTRAINT; Schema: app; Owner: admin
--

ALTER TABLE ONLY app."Movement"
    ADD CONSTRAINT "Movement_pkey" PRIMARY KEY (id);


--
-- Name: Transfer Transfer_pkey; Type: CONSTRAINT; Schema: app; Owner: admin
--

ALTER TABLE ONLY app."Transfer"
    ADD CONSTRAINT "Transfer_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: app; Owner: admin
--

ALTER TABLE ONLY app."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: inventory_campaigns inventory_campaigns_pkey; Type: CONSTRAINT; Schema: app; Owner: admin
--

ALTER TABLE ONLY app.inventory_campaigns
    ADD CONSTRAINT inventory_campaigns_pkey PRIMARY KEY (id);


--
-- Name: inventory_records inventory_records_pkey; Type: CONSTRAINT; Schema: app; Owner: admin
--

ALTER TABLE ONLY app.inventory_records
    ADD CONSTRAINT inventory_records_pkey PRIMARY KEY (id);


--
-- Name: AI_CONVERSATIONS AI_CONVERSATIONS_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."AI_CONVERSATIONS"
    ADD CONSTRAINT "AI_CONVERSATIONS_pkey" PRIMARY KEY (id);


--
-- Name: Asset Asset_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Asset"
    ADD CONSTRAINT "Asset_pkey" PRIMARY KEY (id);


--
-- Name: Assignment Assignment_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Assignment"
    ADD CONSTRAINT "Assignment_pkey" PRIMARY KEY (id);


--
-- Name: Baja Baja_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Baja"
    ADD CONSTRAINT "Baja_pkey" PRIMARY KEY (id);


--
-- Name: MaintenanceReport MaintenanceReport_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."MaintenanceReport"
    ADD CONSTRAINT "MaintenanceReport_pkey" PRIMARY KEY (id);


--
-- Name: Movement Movement_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Movement"
    ADD CONSTRAINT "Movement_pkey" PRIMARY KEY (id);


--
-- Name: Transfer Transfer_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Transfer"
    ADD CONSTRAINT "Transfer_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: inventory_campaigns inventory_campaigns_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.inventory_campaigns
    ADD CONSTRAINT inventory_campaigns_pkey PRIMARY KEY (id);


--
-- Name: inventory_records inventory_records_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.inventory_records
    ADD CONSTRAINT inventory_records_pkey PRIMARY KEY (id);


--
-- Name: Asset_qrCode_key; Type: INDEX; Schema: app; Owner: admin
--

CREATE UNIQUE INDEX "Asset_qrCode_key" ON app."Asset" USING btree ("qrCode");


--
-- Name: Baja_assetId_key; Type: INDEX; Schema: app; Owner: admin
--

CREATE UNIQUE INDEX "Baja_assetId_key" ON app."Baja" USING btree ("assetId");


--
-- Name: User_ci_key; Type: INDEX; Schema: app; Owner: admin
--

CREATE UNIQUE INDEX "User_ci_key" ON app."User" USING btree (ci);


--
-- Name: User_username_key; Type: INDEX; Schema: app; Owner: admin
--

CREATE UNIQUE INDEX "User_username_key" ON app."User" USING btree (username);


--
-- Name: inventory_records_campaignId_assetId_key; Type: INDEX; Schema: app; Owner: admin
--

CREATE UNIQUE INDEX "inventory_records_campaignId_assetId_key" ON app.inventory_records USING btree ("campaignId", "assetId");


--
-- Name: Asset_qrCode_key; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX "Asset_qrCode_key" ON public."Asset" USING btree ("qrCode");


--
-- Name: Baja_assetId_key; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX "Baja_assetId_key" ON public."Baja" USING btree ("assetId");


--
-- Name: User_ci_key; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX "User_ci_key" ON public."User" USING btree (ci);


--
-- Name: User_username_key; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX "User_username_key" ON public."User" USING btree (username);


--
-- Name: inventory_records_campaignId_assetId_key; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX "inventory_records_campaignId_assetId_key" ON public.inventory_records USING btree ("campaignId", "assetId");


--
-- Name: MaintenanceReport MaintenanceReport_assetId_fkey; Type: FK CONSTRAINT; Schema: app; Owner: admin
--

ALTER TABLE ONLY app."MaintenanceReport"
    ADD CONSTRAINT "MaintenanceReport_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES app."Asset"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Movement Movement_assetId_fkey; Type: FK CONSTRAINT; Schema: app; Owner: admin
--

ALTER TABLE ONLY app."Movement"
    ADD CONSTRAINT "Movement_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES app."Asset"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Transfer Transfer_assetId_fkey; Type: FK CONSTRAINT; Schema: app; Owner: admin
--

ALTER TABLE ONLY app."Transfer"
    ADD CONSTRAINT "Transfer_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES app."Asset"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: inventory_records inventory_records_campaignId_fkey; Type: FK CONSTRAINT; Schema: app; Owner: admin
--

ALTER TABLE ONLY app.inventory_records
    ADD CONSTRAINT "inventory_records_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES app.inventory_campaigns(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: MaintenanceReport MaintenanceReport_assetId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."MaintenanceReport"
    ADD CONSTRAINT "MaintenanceReport_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES public."Asset"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Movement Movement_assetId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Movement"
    ADD CONSTRAINT "Movement_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES public."Asset"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Transfer Transfer_assetId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Transfer"
    ADD CONSTRAINT "Transfer_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES public."Asset"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: inventory_records inventory_records_campaignId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.inventory_records
    ADD CONSTRAINT "inventory_records_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES public.inventory_campaigns(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict e43bHg1rmzsVS9z9YnjRCHzOjuCdaxzFMUnu15OvXIJe4wI5Kfc3bxCk0MX0tE2


# Home Doctor Ibarra — Consultorio Médico

Esta es la versión de la app que vive **fuera de Claude**: en internet, con tu propia
base de datos (Supabase) y tu propio link (Vercel).

Sigue estos pasos **una sola vez**. Después de esto, solo usas el link del final todos
los días.

---

## Paso 1 — Crear tu base de datos en Supabase (gratis)

1. Entra a https://supabase.com y crea una cuenta gratis (con tu correo o con Google).
2. Crea un proyecto nuevo. Ponle un nombre, por ejemplo `home-doctor-ibarra`.
   Elige una contraseña para la base de datos y **guárdala** en un lugar seguro.
3. Espera 1-2 minutos a que el proyecto termine de crearse.
4. En el menú de la izquierda, entra a **SQL Editor**.
5. Abre el archivo `supabase/schema.sql` de esta carpeta, copia todo su contenido,
   pégalo en el editor de Supabase y dale a **Run**. Esto crea las tablas.
6. Abre el archivo `supabase/seed.sql`, copia todo su contenido, pégalo en el SQL Editor
   (en una consulta nueva) y dale a **Run**. Esto carga tus 241 pacientes actuales.
7. En el menú de la izquierda, entra a **Authentication → Users** y crea un usuario:
   tu correo y una contraseña. **Este es el usuario con el que vas a entrar a la app.**
8. En el menú de la izquierda, entra a **Project Settings → API**. Ahí vas a ver dos
   datos que necesitas para el siguiente paso:
   - **Project URL** (algo como `https://xxxxx.supabase.co`)
   - **anon public key** (una clave larga de letras y números)

Guarda esos dos datos, los usas en el Paso 3.

---

## Paso 2 — Subir el código a GitHub (gratis)

1. Entra a https://github.com y crea una cuenta gratis si no tienes.
2. Crea un repositorio nuevo (botón "New repository"), llámalo por ejemplo
   `consultorio-home-doctor`. Puede ser privado.
3. Sube todos los archivos de esta carpeta a ese repositorio (puedes arrastrar los
   archivos directamente en la página de GitHub, en el botón "Add file" → "Upload files").

---

## Paso 3 — Publicar en Vercel (gratis)

1. Entra a https://vercel.com y crea una cuenta gratis usando tu cuenta de GitHub
   (botón "Continue with GitHub").
2. Dale a **"Add New" → "Project"**.
3. Elige el repositorio que subiste (`consultorio-home-doctor`) y dale a **Import**.
4. Antes de darle a "Deploy", busca la sección **Environment Variables** y agrega
   estas dos, con los datos que guardaste en el Paso 1:
   - `VITE_SUPABASE_URL` → tu Project URL de Supabase
   - `VITE_SUPABASE_ANON_KEY` → tu anon public key de Supabase
5. Dale a **Deploy**. Espera 1-2 minutos.
6. Cuando termine, Vercel te da un link, algo como
   `https://consultorio-home-doctor.vercel.app`.

**Ese es tu link fijo.** Ábrelo, inicia sesión con el correo y contraseña que creaste
en el Paso 1.7, y ya tienes tu app funcionando de forma permanente, fuera de Claude.

---

## Paso 4 — Instalarla como app en tu celular

1. Abre ese link de Vercel en el navegador de tu celular (Chrome en Android, Safari
   en iPhone).
2. **Android:** toca los tres puntos (⋮) → "Instalar aplicación" o "Añadir a pantalla
   de inicio".
3. **iPhone:** toca el ícono de compartir (cuadrado con flecha) → "Añadir a pantalla
   de inicio".

Ahora tienes un ícono en tu celular que abre directo el consultorio.

---

## Cómo sigues cargando pacientes nuevos

Cuando termines de escanear más hojas y quieras que Claude te ayude a digitalizarlas:

1. Pídele a Claude que las cargue como hasta ahora.
2. Claude te va a dar un bloque de texto (JSON) con los pacientes nuevos.
3. Entra a tu app (el link de Vercel), ve a **Pacientes → Actualizar pacientes**.
4. Pega ese bloque y dale a **Cargar datos**.

Se suman los pacientes nuevos sin borrar nada de lo que ya tienes guardado (citas,
ediciones, pacientes que agregaste a mano).

---

## Nota sobre seguridad.

Esta app tiene un inicio de sesión (correo y contraseña) porque maneja información
médica de personas reales. No compartas el correo/contraseña ni el link de forma
pública. Si en el futuro más personas de tu consultorio necesitan entrar, puedes
crear más usuarios en Supabase (Authentication → Users → Add user) y darles su propio
correo y contraseña.

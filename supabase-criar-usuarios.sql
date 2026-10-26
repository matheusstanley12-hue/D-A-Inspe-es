-- ==============================================================================
-- D&A INSPEÇÕES - CRIAÇÃO DIRETA DOS USUÁRIOS NO SUPABASE AUTH
-- Cole e execute este script no SQL Editor do Supabase.
-- Ele insere todos os usuários com e-mail já confirmado, sem bloqueio de taxa de e-mail!
-- ==============================================================================

DO $$
DECLARE
  v_user RECORD;
  v_user_id UUID;
  v_encrypted_pwd TEXT;
  v_encrypted_master TEXT;
BEGIN
  -- Criptografia das senhas iniciais com bcrypt (extensão pgcrypto)
  v_encrypted_pwd := crypt('123456', gen_salt('bf', 10));
  v_encrypted_master := crypt('35215415', gen_salt('bf', 10));

  -- Lista de todos os usuários do sistema
  FOR v_user IN 
    SELECT * FROM (VALUES
      ('matheus.stanley12@gmail.com', 'Matheus Stanley', 'gestor', false, v_encrypted_master),
      ('bruno.ribeiro@deainspecoes.com.br', 'Bruno Ribeiro', 'inspetor', true, v_encrypted_pwd),
      ('yuri.duarte@deainspecoes.com.br', 'Yuri Duarte', 'gestor', true, v_encrypted_pwd),
      ('contato@deainspecoes.com.br', 'Augusto', 'gestor', true, v_encrypted_pwd),
      ('fabio.reis@deainspecoes.com.br', 'Fabio', 'gestor', true, v_encrypted_pwd),
      ('admin@deainspecoes.com.br', 'Administrador D&A', 'gestor', false, v_encrypted_pwd),
      ('inspetor@deainspecoes.com.br', 'Inspetor D&A', 'inspetor', true, v_encrypted_pwd)
    ) AS t(email, name, role, must_change, pwd)
  LOOP
    -- Verifica se o usuário já existe no auth.users
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_user.email;

    IF v_user_id IS NULL THEN
      v_user_id := gen_random_uuid();

      -- Insere no auth.users com e-mail já confirmado
      INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at
      )
      VALUES (
        '00000000-0000-0000-0000-000000000000',
        v_user_id,
        'authenticated',
        'authenticated',
        v_user.email,
        v_user.pwd,
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object(
          'name', v_user.name,
          'role', v_user.role,
          'status', 'ativo',
          'must_change_password', v_user.must_change
        ),
        now(),
        now()
      );

      -- Insere na tabela auth.identities para permitir login com e-mail e senha
      INSERT INTO auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        provider_id,
        last_sign_in_at,
        created_at,
        updated_at
      )
      VALUES (
        v_user_id::text,
        v_user_id,
        jsonb_build_object('sub', v_user_id::text, 'email', v_user.email),
        'email',
        v_user.email,
        now(),
        now(),
        now()
      )
      ON CONFLICT (provider, provider_id) DO NOTHING;

    ELSE
      -- Se já existia, atualiza os metadados e garante e-mail confirmado
      UPDATE auth.users
      SET 
        email_confirmed_at = COALESCE(email_confirmed_at, now()),
        raw_user_meta_data = jsonb_build_object(
          'name', v_user.name,
          'role', v_user.role,
          'status', 'ativo',
          'must_change_password', v_user.must_change
        ),
        updated_at = now()
      WHERE id = v_user_id;
    END IF;

    -- Garante sincronização também na tabela public.profiles
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
      INSERT INTO public.profiles (
        id,
        name,
        email,
        role,
        status,
        must_change_password,
        updated_at
      )
      VALUES (
        v_user_id,
        v_user.name,
        v_user.email,
        v_user.role,
        'ativo',
        v_user.must_change,
        now()
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        status = EXCLUDED.status,
        updated_at = now();
    END IF;

  END LOOP;
END $$;

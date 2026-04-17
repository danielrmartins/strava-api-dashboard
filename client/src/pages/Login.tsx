interface Props {
  error?: string;
}

export function Login({ error }: Props) {
  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L8 9H2L7 14L5 21L12 17L19 21L17 14L22 9H16L12 2Z" fill="#fc4c02" />
          </svg>
        </div>
        <h1>Corre que é Dado</h1>
        <p>Analise sua performance de corrida com dados diretamente do Strava.</p>

        {error === 'access_denied' && (
          <div className="login-error">Autorização negada. Tente novamente.</div>
        )}

        <a href="/auth/strava" className="btn-strava">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
          </svg>
          Conectar com Strava
        </a>

        <p className="login-footer">
          Seus dados ficam vinculados à sua conta. Cada pessoa vê apenas suas próprias corridas.
        </p>
      </div>
    </div>
  );
}

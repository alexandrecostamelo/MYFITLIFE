/* eslint-disable @typescript-eslint/no-explicit-any */

export interface WearableProvider {
  id: string;
  name: string;
  authUrl(state: string, redirectUri: string): string;
  exchangeCode(
    code: string,
    redirectUri: string,
  ): Promise<{
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    user_id?: string;
  }>;
  refreshToken(
    refreshToken: string,
  ): Promise<{
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
  }>;
  fetchData(
    accessToken: string,
    startDate: Date,
    endDate: Date,
  ): Promise<
    { metric: string; value: number; unit: string; sampled_at: string }[]
  >;
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

async function formPost(
  url: string,
  body: Record<string, string>,
  headers?: Record<string, string>,
) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...headers },
    body: new URLSearchParams(body).toString(),
  });
  return res.json();
}

async function jsonGet(url: string, token: string) {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

// ---------------------------------------------------------------------------
// Fitbit
// ---------------------------------------------------------------------------

export const FITBIT: WearableProvider = {
  id: 'fitbit',
  name: 'Fitbit',

  authUrl(state, redirectUri) {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: process.env.FITBIT_CLIENT_ID!,
      redirect_uri: redirectUri,
      scope: 'activity heartrate sleep weight profile',
      state,
    });
    return `https://www.fitbit.com/oauth2/authorize?${params}`;
  },

  async exchangeCode(code, redirectUri) {
    const auth = Buffer.from(
      `${process.env.FITBIT_CLIENT_ID}:${process.env.FITBIT_CLIENT_SECRET}`,
    ).toString('base64');
    const data = await formPost(
      'https://api.fitbit.com/oauth2/token',
      { grant_type: 'authorization_code', code, redirect_uri: redirectUri },
      { Authorization: `Basic ${auth}` },
    );
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      user_id: data.user_id,
    };
  },

  async refreshToken(rt) {
    const auth = Buffer.from(
      `${process.env.FITBIT_CLIENT_ID}:${process.env.FITBIT_CLIENT_SECRET}`,
    ).toString('base64');
    const data = await formPost(
      'https://api.fitbit.com/oauth2/token',
      { grant_type: 'refresh_token', refresh_token: rt },
      { Authorization: `Basic ${auth}` },
    );
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
    };
  },

  async fetchData(token, startDate, endDate) {
    const samples: any[] = [];
    const start = startDate.toISOString().slice(0, 10);
    const end = endDate.toISOString().slice(0, 10);

    try {
      const steps = await jsonGet(
        `https://api.fitbit.com/1/user/-/activities/steps/date/${start}/${end}.json`,
        token,
      );
      for (const d of steps['activities-steps'] || []) {
        samples.push({
          metric: 'steps',
          value: parseInt(d.value),
          unit: 'count',
          sampled_at: `${d.dateTime}T23:59:59Z`,
        });
      }
    } catch {
      /* ignore */
    }

    try {
      const hr = await jsonGet(
        `https://api.fitbit.com/1/user/-/activities/heart/date/${start}/${end}.json`,
        token,
      );
      for (const d of hr['activities-heart'] || []) {
        if (d.value?.restingHeartRate) {
          samples.push({
            metric: 'resting_heart_rate',
            value: d.value.restingHeartRate,
            unit: 'bpm',
            sampled_at: `${d.dateTime}T12:00:00Z`,
          });
        }
      }
    } catch {
      /* ignore */
    }

    try {
      const sleep = await jsonGet(
        `https://api.fitbit.com/1.2/user/-/sleep/date/${start}/${end}.json`,
        token,
      );
      for (const s of sleep.sleep || []) {
        samples.push({
          metric: 'sleep_duration',
          value: s.duration / 3600000,
          unit: 'hours',
          sampled_at: s.startTime,
        });
      }
    } catch {
      /* ignore */
    }

    try {
      const hrv = await jsonGet(
        `https://api.fitbit.com/1/user/-/hrv/date/${start}/${end}.json`,
        token,
      );
      for (const d of hrv.hrv || []) {
        if (d.value?.dailyRmssd) {
          samples.push({
            metric: 'hrv',
            value: d.value.dailyRmssd,
            unit: 'ms',
            sampled_at: `${d.dateTime}T12:00:00Z`,
          });
        }
      }
    } catch {
      /* ignore */
    }

    return samples;
  },
};

// ---------------------------------------------------------------------------
// WHOOP
// ---------------------------------------------------------------------------

export const WHOOP: WearableProvider = {
  id: 'whoop',
  name: 'WHOOP',

  authUrl(state, redirectUri) {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: process.env.WHOOP_CLIENT_ID!,
      redirect_uri: redirectUri,
      scope:
        'read:recovery read:sleep read:workout read:body_measurement read:profile',
      state,
    });
    return `https://api.prod.whoop.com/oauth/oauth2/auth?${params}`;
  },

  async exchangeCode(code, redirectUri) {
    const data = await formPost(
      'https://api.prod.whoop.com/oauth/oauth2/token',
      {
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: process.env.WHOOP_CLIENT_ID!,
        client_secret: process.env.WHOOP_CLIENT_SECRET!,
      },
    );
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
    };
  },

  async refreshToken(rt) {
    const data = await formPost(
      'https://api.prod.whoop.com/oauth/oauth2/token',
      {
        grant_type: 'refresh_token',
        refresh_token: rt,
        client_id: process.env.WHOOP_CLIENT_ID!,
        client_secret: process.env.WHOOP_CLIENT_SECRET!,
      },
    );
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
    };
  },

  async fetchData(token, startDate, endDate) {
    const samples: any[] = [];
    const start = startDate.toISOString();
    const end = endDate.toISOString();

    try {
      const recovery = await jsonGet(
        `https://api.prod.whoop.com/developer/v1/recovery?start=${start}&end=${end}`,
        token,
      );
      for (const r of recovery.records || []) {
        if (r.score?.hrv_rmssd_milli) {
          samples.push({
            metric: 'hrv',
            value: r.score.hrv_rmssd_milli,
            unit: 'ms',
            sampled_at: r.created_at,
          });
        }
        if (r.score?.resting_heart_rate) {
          samples.push({
            metric: 'resting_heart_rate',
            value: r.score.resting_heart_rate,
            unit: 'bpm',
            sampled_at: r.created_at,
          });
        }
      }
    } catch {
      /* ignore */
    }

    try {
      const sleepData = await jsonGet(
        `https://api.prod.whoop.com/developer/v1/activity/sleep?start=${start}&end=${end}`,
        token,
      );
      for (const s of sleepData.records || []) {
        if (s.score?.total_in_bed_time_milli) {
          samples.push({
            metric: 'sleep_duration',
            value: s.score.total_in_bed_time_milli / 3600000,
            unit: 'hours',
            sampled_at: s.start,
          });
        }
      }
    } catch {
      /* ignore */
    }

    return samples;
  },
};

// ---------------------------------------------------------------------------
// Garmin (OAuth 1.0a — placeholder, full impl requires oauth1 lib)
// TODO: Implementar OAuth 1.0a com lib como 'oauth-1.0a'.
// TODO: Garmin usa Push API (webhooks) para dados — implementar endpoint receiver.
// TODO: Registrar app em https://developerportal.garmin.com
// ---------------------------------------------------------------------------

export const GARMIN: WearableProvider = {
  id: 'garmin',
  name: 'Garmin',

  authUrl(state, redirectUri) {
    // TODO: OAuth 1.0a requer request token → authorize → access token flow
    return `https://connect.garmin.com/oauthConfirm?oauth_callback=${encodeURIComponent(redirectUri)}&state=${state}`;
  },

  async exchangeCode(code) {
    // TODO: Implementar OAuth 1.0a token exchange com signing
    return { access_token: code };
  },

  async refreshToken() {
    // TODO: Garmin OAuth 1.0a tokens não expiram — implementar reauth se revogado
    return { access_token: '', expires_in: 0 };
  },

  async fetchData() {
    // TODO: Implementar recebimento via Garmin Health API Push (webhooks)
    return [];
  },
};

// ---------------------------------------------------------------------------
// Mi Band / Zepp
// TODO: API Zepp não é totalmente pública — verificar acesso developer.
// TODO: Implementar fetchData() com endpoints de sleep, activity, heart_rate.
// TODO: Testar fluxo OAuth com conta Zepp real.
// ---------------------------------------------------------------------------

export const MI_BAND: WearableProvider = {
  id: 'mi_band',
  name: 'Mi Band / Zepp',

  authUrl(state, redirectUri) {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: process.env.ZEPP_CLIENT_ID || '',
      redirect_uri: redirectUri,
      scope: 'data:sleep data:activity data:heart_rate',
      state,
    });
    return `https://account.zepp.com/oauth2/authorize?${params}`;
  },

  async exchangeCode(code, redirectUri) {
    const data = await formPost(
      'https://account.zepp.com/oauth2/access_token',
      {
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: process.env.ZEPP_CLIENT_ID!,
        client_secret: process.env.ZEPP_CLIENT_SECRET!,
      },
    );
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
    };
  },

  async refreshToken(rt) {
    const data = await formPost(
      'https://account.zepp.com/oauth2/access_token',
      {
        grant_type: 'refresh_token',
        refresh_token: rt,
        client_id: process.env.ZEPP_CLIENT_ID!,
        client_secret: process.env.ZEPP_CLIENT_SECRET!,
      },
    );
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
    };
  },

  async fetchData() {
    // TODO: Implementar fetching de dados Zepp (sleep, activity, heart_rate)
    return [];
  },
};

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export const PROVIDERS: Record<string, WearableProvider> = {
  fitbit: FITBIT,
  whoop: WHOOP,
  garmin: GARMIN,
  mi_band: MI_BAND,
};

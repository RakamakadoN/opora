import { getChildColorToken } from "./familyCalendar";

export type NormalizedFamilyChildProfile = {
  localChildId: string;
  name: string;
  ageYears: number;
  diagnosticStatus: string | null;
  city: string | null;
  colorToken: string;
};

export type FamilyBackfillUser = {
  id: string;
  fullName: string;
};

export type FamilyBackfillPlan = {
  ownerUserId: string;
  familyDisplayName: string;
  profiles: NormalizedFamilyChildProfile[];
};

export type ChildUpsertStatement = {
  sql: string;
  values: [string, string, string, number, string | null, string | null, string];
};

const normalizeText = (value: unknown) => String(value ?? "").replace(/\s+/g, " ").trim();

const clampAgeYears = (value: unknown) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.min(18, Math.trunc(parsed)));
};

const hasLegacyProfileShape = (state: any) => {
  if (!state || typeof state !== "object") return false;
  return Boolean(
    state.childName ||
      state.name ||
      state.childAge !== undefined ||
      state.age_years !== undefined ||
      state.diagnosticStatus ||
      state.diagnostic_status ||
      state.userCity ||
      state.city
  );
};

const toNormalizedProfile = (profile: any, index: number): NormalizedFamilyChildProfile => {
  const localChildId = normalizeText(profile?.id || profile?.localChildId || profile?.local_child_id || `default-child-${index + 1}`) || `default-child-${index + 1}`;
  return {
    localChildId,
    name: normalizeText(profile?.childName || profile?.name || "Ребенок") || "Ребенок",
    ageYears: clampAgeYears(profile?.childAge ?? profile?.ageYears ?? profile?.age_years),
    diagnosticStatus: normalizeText(profile?.diagnosticStatus || profile?.diagnostic_status) || null,
    city: normalizeText(profile?.userCity || profile?.city) || null,
    colorToken: getChildColorToken(localChildId)
  };
};

export function normalizeProfileState(state: any): NormalizedFamilyChildProfile[] {
  if (Array.isArray(state?.profiles) && state.profiles.length > 0) {
    return state.profiles.map((profile, index) => toNormalizedProfile(profile, index));
  }

  if (hasLegacyProfileShape(state)) {
    return [toNormalizedProfile(state, 0)];
  }

  return [];
}

export function buildFamilyDisplayName(fullName: string): string {
  const cleaned = normalizeText(fullName);
  return `${cleaned || "Родитель"}: семья`;
}

export function buildFamilyBackfillPlan(user: FamilyBackfillUser, state: any): FamilyBackfillPlan {
  return {
    ownerUserId: user.id,
    familyDisplayName: buildFamilyDisplayName(user.fullName),
    profiles: normalizeProfileState(state)
  };
}

export function buildFamilyMembershipStatement(familyId: string, userId: string) {
  return {
    sql: `insert into family_members (family_id, user_id, role)
          values ($1, $2, 'owner')
          on conflict (family_id, user_id) do update set role = excluded.role`,
    values: [familyId, userId] as [string, string]
  };
}

export function buildChildUpsertStatement(familyId: string, profile: NormalizedFamilyChildProfile): ChildUpsertStatement {
  return {
    sql: `insert into children (family_id, local_child_id, name, age_years, diagnostic_status, city, color_token, updated_at)
          values ($1, $2, $3, $4, $5, $6, $7, now())
          on conflict (family_id, local_child_id)
          do update set
            name = excluded.name,
            age_years = excluded.age_years,
            diagnostic_status = excluded.diagnostic_status,
            city = excluded.city,
            color_token = excluded.color_token,
            updated_at = now()
          returning id, local_child_id`,
    values: [
      familyId,
      profile.localChildId,
      profile.name,
      profile.ageYears,
      profile.diagnosticStatus,
      profile.city,
      profile.colorToken
    ]
  };
}

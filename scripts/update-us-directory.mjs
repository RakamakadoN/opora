import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const configPath = path.join(rootDir, 'data', 'us-directory.config.json');
const outputPath = path.join(rootDir, 'src', 'data', 'us-directory.generated.ts');
const jsonOutputPath = path.join(rootDir, 'data', 'us-directory.generated.json');

const config = JSON.parse(await readFile(configPath, 'utf8'));
const generatedAt = new Date().toISOString().slice(0, 10);

const normalizeText = (value) => String(value || '').replace(/\s+/g, ' ').trim();
const titleCase = (value) => normalizeText(value).toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());

const fetchJson = async (url) => {
  const response = await fetch(url, {
    headers: {
      accept: 'application/json',
      'user-agent': 'Opora autism family navigator data updater'
    }
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${url}`);
  }

  return response.json();
};

const providerName = (provider) => {
  const basic = provider.basic || {};
  if (provider.enumeration_type === 'NPI-2') {
    return normalizeText(basic.organization_name || basic.name || 'Healthcare organization');
  }

  return normalizeText([
    basic.first_name,
    basic.middle_name,
    basic.last_name,
    basic.credential ? `, ${basic.credential}` : ''
  ].filter(Boolean).join(' ')) || normalizeText(basic.name || 'Healthcare provider');
};

const providerAddress = (provider) => {
  const address = (provider.addresses || []).find((item) => item.address_purpose === 'LOCATION') || provider.addresses?.[0] || {};
  const line = [address.address_1, address.address_2].filter(Boolean).join(', ');
  const city = normalizeText(address.city);
  const state = normalizeText(address.state);
  const postal = normalizeText(address.postal_code);

  return {
    line: normalizeText([line, city, state, postal].filter(Boolean).join(', ')),
    city: [city, state].filter(Boolean).join(', '),
    state,
    phone: normalizeText(address.telephone_number)
  };
};

const providerMatchesCategory = (provider, taxonomyDescription) => {
  const wanted = taxonomyDescription.toLowerCase();
  return (provider.taxonomies || []).some((taxonomy) =>
    String(taxonomy.desc || '').toLowerCase().includes(wanted)
  );
};

const mapNpiProvider = (provider, query, state, id) => {
  const address = providerAddress(provider);
  const taxonomy = (provider.taxonomies || []).find((item) =>
    String(item.desc || '').toLowerCase().includes(query.taxonomyDescription.toLowerCase())
  ) || provider.taxonomies?.[0] || {};
  const name = providerName(provider);
  const npi = normalizeText(provider.number);
  const taxonomyDesc = normalizeText(taxonomy.desc || query.taxonomyDescription);
  const city = address.city || `US, ${state}`;

  return {
    id,
    name,
    city,
    title: taxonomyDesc,
    desc: `${taxonomyDesc}. Provider appears in the official NPPES NPI Registry. Autism/sensory-friendly fit still needs parent or admin verification before recommendation.`,
    address: address.line || city,
    website: `https://npiregistry.cms.hhs.gov/provider-view/${npi}`,
    sourceUrl: `https://npiregistry.cms.hhs.gov/provider-view/${npi}`,
    sourceLabel: config.sources.npi.label,
    lastVerified: generatedAt,
    verificationStatus: 'needs_review',
    tags: [...new Set([...query.tags, 'USA', state, 'Needs parent confirmation'])],
    type: query.type,
    rating: 0,
    ratingCount: 0,
    phone: address.phone || 'Call provider',
    reviews: [],
    country: 'US',
    state,
    npi,
    sourceKind: 'npi',
    confidenceScore: 0.68,
    parentConfirmed: false,
    needsReview: true
  };
};

const updateNpiProviders = async () => {
  const items = [];
  let id = 900000;

  for (const query of config.npiQueries) {
    for (const state of config.states) {
      const url = new URL(config.sources.npi.api);
      url.searchParams.set('version', '2.1');
      url.searchParams.set('taxonomy_description', query.taxonomyDescription);
      url.searchParams.set('state', state);
      url.searchParams.set('limit', String(config.maxPerQuery));

      try {
        const payload = await fetchJson(url);
        const providers = (payload.results || [])
          .filter((provider) => providerMatchesCategory(provider, query.taxonomyDescription))
          .map((provider) => mapNpiProvider(provider, query, state, id++));

        items.push(...providers);
      } catch (error) {
        console.warn(`[NPI] ${query.taxonomyDescription} ${state}: ${error.message}`);
      }
    }
  }

  return items;
};

const updateClinicalTrials = async () => {
  const url = new URL(config.sources.clinicalTrials.api);
  url.searchParams.set('query.term', 'autism OR autism spectrum disorder OR ASD');
  url.searchParams.set('pageSize', '12');
  url.searchParams.set('format', 'json');

  try {
    const payload = await fetchJson(url);
    return (payload.studies || []).filter((study) => {
      const protocol = study.protocolSection || {};
      const identification = protocol.identificationModule || {};
      const conditions = protocol.conditionsModule || {};
      const contacts = protocol.contactsLocationsModule || {};
      const conditionText = [...(conditions.conditions || [])].join(' ');
      const hasAutismCondition = /\bautism\b|autism spectrum|spectrum disorder|\bASD\b/i.test(conditionText);
      const hasUsLocation = (contacts.locations || []).some((location) =>
        String(location.country || '').toLowerCase() === 'united states'
      );
      return hasAutismCondition && hasUsLocation;
    }).map((study, index) => {
      const protocol = study.protocolSection || {};
      const identification = protocol.identificationModule || {};
      const status = protocol.statusModule || {};
      const design = protocol.designModule || {};
      const conditions = protocol.conditionsModule || {};
      const contacts = protocol.contactsLocationsModule || {};
      const locations = contacts.locations || [];
      const firstLocation = locations[0] || {};

      return {
        id: identification.nctId || `trial-${index}`,
        title: normalizeText(identification.briefTitle || identification.officialTitle || 'Autism study'),
        status: normalizeText(status.overallStatus || 'Unknown'),
        phases: design.phases || [],
        conditions: conditions.conditions || [],
        city: normalizeText(firstLocation.city),
        state: normalizeText(firstLocation.state),
        country: normalizeText(firstLocation.country || 'United States'),
        sourceUrl: `https://clinicaltrials.gov/study/${identification.nctId}`,
        sourceLabel: config.sources.clinicalTrials.label,
        lastVerified: generatedAt
      };
    });
  } catch (error) {
    console.warn(`[ClinicalTrials] ${error.message}`);
    return [];
  }
};

const mapTreatmentApproaches = () => config.treatmentApproaches.map((approach) => ({
  ...approach,
  sourceUrl: config.sources.cdc.url,
  lastVerified: generatedAt,
  caveat: 'Educational information only. Discuss treatment choices with licensed clinicians.'
}));

const uniqueBy = (items, getKey) => {
  const map = new Map();
  for (const item of items) {
    const key = getKey(item);
    if (!map.has(key)) map.set(key, item);
  }
  return Array.from(map.values());
};

const providers = uniqueBy(await updateNpiProviders(), (item) => item.npi || `${item.name}|${item.city}`);
const clinicalTrials = await updateClinicalTrials();
const treatmentApproaches = mapTreatmentApproaches();

const meta = {
  generatedAt,
  sourceCount: Object.keys(config.sources).length,
  providerCount: providers.length,
  clinicalTrialCount: clinicalTrials.length,
  updatePolicy: {
    npi: 'daily by state/category',
    clinicalTrials: 'weekly for ASD studies',
    cdc: 'manual review when CDC page changes',
    parentRecommendations: 'manual moderation before verified status'
  },
  sources: [
    { label: config.sources.npi.label, url: config.sources.npi.url },
    { label: config.sources.clinicalTrials.label, url: config.sources.clinicalTrials.url },
    { label: config.sources.cdc.label, url: config.sources.cdc.url }
  ]
};

const generated = `// Generated by scripts/update-us-directory.mjs. Do not edit by hand.
export const US_CATALOG_META = ${JSON.stringify(meta, null, 2)} as const;

export const US_DIRECTORY_ITEMS = ${JSON.stringify(providers, null, 2)} as const;

export const US_TREATMENT_APPROACHES = ${JSON.stringify(treatmentApproaches, null, 2)} as const;

export const US_CLINICAL_TRIALS = ${JSON.stringify(clinicalTrials, null, 2)} as const;
`;

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, generated, 'utf8');
await writeFile(jsonOutputPath, JSON.stringify({
  meta,
  providers,
  treatmentApproaches,
  clinicalTrials
}, null, 2), 'utf8');

console.log(`US providers: ${providers.length}`);
console.log(`US clinical trials: ${clinicalTrials.length}`);
console.log(`Generated -> ${path.relative(rootDir, outputPath)}`);
console.log(`Generated -> ${path.relative(rootDir, jsonOutputPath)}`);

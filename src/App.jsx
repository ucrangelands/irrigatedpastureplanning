import React, { useEffect, useMemo, useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

const STORAGE_KEY = 'ipnmp-standalone-v1'
const URL_PARAM = 'scenario'

const ET_ZONES = {
  1: { label: 'Coastal Plains Heavy Fog Belt (Zone 1)', monthly: [0.93, 1.4, 2.48, 3.3, 4.03, 4.5, 4.65, 4.03, 3.3, 2.48, 1.2, 0.62] },
  2: { label: 'Coastal Mixed Fog Area (Zone 2)', monthly: [1.24, 1.68, 3.1, 3.9, 4.65, 5.1, 4.96, 4.65, 3.9, 2.79, 1.8, 1.24] },
  3: { label: 'Coastal Valleys and Plains and North Coast Mountains (Zone 3)', monthly: [1.86, 2.24, 3.72, 4.8, 5.27, 5.7, 5.58, 5.27, 4.2, 3.41, 2.4, 1.86] },
  4: { label: 'South Coast Inland Plains and Mountains North of San Francisco (Zone 4)', monthly: [1.86, 2.24, 3.41, 4.5, 5.27, 5.7, 5.89, 5.58, 4.5, 3.41, 2.4, 1.86] },
  5: { label: 'Northern Inland Valleys (Zone 5)', monthly: [1.86, 2.24, 3.41, 4.5, 5.27, 5.7, 5.89, 5.58, 4.5, 3.41, 2.4, 1.86] },
  6: { label: 'Upland Central Coast and Los Angeles Basin (Zone 6)', monthly: [1.86, 2.24, 3.41, 4.8, 5.58, 6.3, 6.51, 6.2, 4.8, 3.72, 2.4, 1.86] },
  7: { label: 'Northeastern Plains and Modoc Plateau (Zone 7)', monthly: [0.62, 1.4, 2.48, 3.9, 5.27, 6.3, 7.44, 6.51, 4.8, 2.79, 1.2, 0.62] },
  8: { label: 'Inland San Francisco Bay Area (Zone 8)', monthly: [1.24, 1.68, 3.41, 4.5, 6.2, 6.9, 7.44, 6.51, 5.1, 3.41, 1.8, 0.93] },
  9: { label: 'South Coast Marine to Desert Transition (Zone 9)', monthly: [2.17, 2.8, 4.03, 5.1, 5.89, 6.6, 7.44, 6.82, 5.7, 4.03, 2.7, 1.86] },
  10: { label: 'North Central Plateau and Central Coast Range (Zone 10)', monthly: [0.93, 1.68, 3.1, 4.5, 5.89, 7.2, 8.06, 7.13, 5.1, 3.1, 1.5, 0.93] },
  11: { label: 'Central Sierra Nevada (Zone 11)', monthly: [1.55, 2.24, 3.1, 4.5, 5.89, 7.2, 8.06, 7.44, 5.7, 3.72, 2.1, 1.55] },
  12: { label: 'Eastside Sacramento-San Joaquin Valley (Zone 12)', monthly: [1.24, 1.96, 3.41, 5.1, 6.82, 7.8, 8.06, 7.13, 5.4, 3.72, 1.8, 0.93] },
  13: { label: 'Northern Sierra Nevada (Zone 13)', monthly: [1.24, 1.96, 3.1, 4.8, 6.51, 7.8, 8.99, 7.75, 5.7, 3.72, 1.8, 0.93] },
  14: { label: 'Mid-central Valley, Southern Sierra Nevada, Tehachapi, and High Desert Mountains (Zone 14)', monthly: [1.55, 2.24, 3.72, 5.1, 6.82, 7.8, 8.68, 7.75, 5.7, 4.03, 2.1, 1.55] },
  15: { label: 'Northern and Southern San Joaquin Valley (Zone 15)', monthly: [1.24, 2.24, 3.72, 5.7, 7.44, 8.1, 8.68, 7.75, 5.7, 4.03, 2.1, 1.24] },
  16: { label: 'Westside San Joaquin, Mountains East and West of Imperial Valley (Zone 16)', monthly: [1.55, 2.52, 4.03, 5.7, 7.75, 8.7, 9.3, 8.37, 6.3, 4.34, 2.4, 1.55] },
  17: { label: 'High Desert Valleys (Zone 17)', monthly: [1.86, 2.8, 4.65, 6.0, 8.06, 9.0, 9.92, 8.68, 6.6, 4.34, 2.7, 1.86] },
  18: { label: 'Imperial Valley, Death Valley, and Palo Verde (Zone 18)', monthly: [2.48, 3.36, 5.27, 6.9, 8.68, 9.6, 9.61, 8.68, 6.9, 4.96, 3.0, 2.17] },
}

const IRRIGATION_SOURCES = [
  { label: 'Estimate of typical natural background levels of nitrate', value: 9 },
  { label: 'Estimate with nitrate levels considered to be high (CA maximum contaminant level)', value: 45 },
  { label: 'Estimate for valley surface water with typical levels of nitrate', value: 2.0 },
  { label: 'Estimate for foothill/mountain meadow surface water with typical nitrate levels', value: 0.12 },
  { label: 'Enter specific value of N-NO3 ppm for irrigation source (if known)', value: 0 },
]

const SYNTHETIC_FERTILIZERS = [
  { label: 'urea (46-0-0)', nFraction: 0.46 },
  { label: 'urea ammonium nitrate (28 to 32-0-0)', nFraction: 0.30 },
  { label: 'ammonium nitrate (33-0-0)', nFraction: 0.33 },
  { label: 'diammonium phosphate (18-46-0)', nFraction: 0.18 },
  { label: 'ammonium sulfate (21-0-0-24S)', nFraction: 0.21 },
  { label: 'calcium ammonium nitrate (27-0-0)', nFraction: 0.27 },
  { label: 'calcium nitrate (16-0-0)', nFraction: 0.16 },
]

const MANURE_OPTIONS = [
  { label: 'Chicken manure (3% available N)', nFraction: 0.0299 },
  { label: 'Composted chicken manure (0.6% available N)', nFraction: 0.00595 },
  { label: 'Steer manure (1% available N)', nFraction: 0.0104 },
  { label: 'Compost (0.5% available N)', nFraction: 0.005 },
  { label: 'Enter a custom nitrogen content', nFraction: 0 },
]

const HAY_OPTIONS = [
  { label: 'Tall fescue (16% crude protein)', crudeProteinPct: 16 },
  { label: 'Timothy grass (14% crude protein)', crudeProteinPct: 14 },
  { label: 'Sorghum-Sudan', crudeProteinPct: 12 },
  { label: 'Bermuda grass (11% crude protein)', crudeProteinPct: 11 },
  { label: 'Rye grass (9% crude protein)', crudeProteinPct: 9 },
  { label: 'Alfalfa (20% crude protein)', crudeProteinPct: 20 },
  { label: 'Enter specific % crude protein (if known)', crudeProteinPct: 0 },
]

const CATTLE_CLASSES = [
  { key: 'cowsNoCalf', label: 'Mature cows without a calf', au: 1.0 },
  { key: 'cowCalf', label: 'Cow with a calf', au: 1.2 },
  { key: 'yearlings', label: 'Weaned calf to yearling', au: 0.6 },
  { key: 'steersHeifers', label: 'Steers and heifers', au: 1.0 },
  { key: 'bulls', label: 'Mature bulls', au: 1.3 },
]

const SMALL_RUMINANT_CLASSES = [
  { key: 'ewesNoLambs', label: 'Mature ewes without lambs', au: 0.18 },
  { key: 'ewesLambs', label: 'Ewes with lambs', au: 0.2 },
  { key: 'lambsYearlings', label: 'Weaned lambs to yearlings', au: 0.12 },
  { key: 'rams', label: 'Mature rams', au: 0.26 },
  { key: 'kidsYearlings', label: 'Weaned kids to yearlings', au: 0.1 },
  { key: 'does', label: 'Does with or without kids', au: 1 / 6 },
  { key: 'bucks', label: 'Mature bucks', au: 0.21666667 },
]

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const DEFAULTS = {
  pastureAcres: 100,
  includeIrrigationN: true,
  irrigationUnit: 'acreFeet',
  irrigationDays: 0,
  waterApplied: 100,
  irrigationSourceIndex: 0,
  irrigationNppmCustom: 0,
  estimateETo: true,
  etoZone: 1,
  irrigationMonths: [false, false, false, false, true, true, true, true, true, false, false, false],
  includeSoilN: false,
  soilN: 0,
  applySyntheticFertilizer: false,
  syntheticRate: 0,
  syntheticFormulaIndex: 0,
  applyManure: false,
  manureRate: 0,
  manureOptionIndex: 0,
  manureCustomFraction: 0,
  includeHaying: false,
  hayHarvestLbAc: 0,
  hayOptionIndex: 0,
  hayCustomCrudeProteinPct: 0,
  cattle: {
    cowsNoCalf: { count: 0, days: 0 },
    cowCalf: { count: 0, days: 0 },
    yearlings: { count: 0, days: 0 },
    steersHeifers: { count: 0, days: 0 },
    bulls: { count: 0, days: 0 },
  },
  smallRuminants: {
    ewesNoLambs: { count: 0, days: 0 },
    ewesLambs: { count: 0, days: 0 },
    lambsYearlings: { count: 0, days: 0 },
    rams: { count: 0, days: 0 },
    kidsYearlings: { count: 0, days: 0 },
    does: { count: 0, days: 0 },
    bucks: { count: 0, days: 0 },
  },
  horses: { count: 0, days: 0 },
}

const num = (v) => Number(v) || 0
const round = (n, digits = 1) => {
  const p = 10 ** digits
  return Math.round((Number(n) || 0) * p) / p
}

function encodeScenario(values) {
  try {
    return btoa(encodeURIComponent(JSON.stringify(values)))
  } catch {
    return ''
  }
}

function decodeScenario(value) {
  try {
    return JSON.parse(decodeURIComponent(atob(value)))
  } catch {
    return null
  }
}

function calculate(values) {
  const acres = num(values.pastureAcres)

  const waterAppliedAcFtYear =
    values.irrigationUnit === 'acreFeet'
      ? num(values.waterApplied)
      : ((num(values.waterApplied) / 40) * 723.97) * (num(values.irrigationDays) / 365)

  const irrigationInches = acres > 0 ? (waterAppliedAcFtYear / acres) * 12 : 0

  const etoZone = ET_ZONES[values.etoZone]
  const etoDemand = values.estimateETo
    ? etoZone.monthly.reduce((sum, value, i) => sum + (values.irrigationMonths[i] ? value : 0), 0)
    : 0

  const irrigationNppm = values.includeIrrigationN
    ? (IRRIGATION_SOURCES[values.irrigationSourceIndex].value > 0
        ? IRRIGATION_SOURCES[values.irrigationSourceIndex].value
        : num(values.irrigationNppmCustom))
    : 0

  const irrigationWaterN = values.includeIrrigationN && acres > 0
    ? ((irrigationNppm * 2.71936145) * waterAppliedAcFtYear) / acres
    : 0

  const soilN = values.includeSoilN ? num(values.soilN) : 0
  const syntheticNFraction = SYNTHETIC_FERTILIZERS[values.syntheticFormulaIndex].nFraction
  const syntheticN = values.applySyntheticFertilizer ? num(values.syntheticRate) * syntheticNFraction : 0

  const manureFraction = MANURE_OPTIONS[values.manureOptionIndex].nFraction > 0
    ? MANURE_OPTIONS[values.manureOptionIndex].nFraction
    : num(values.manureCustomFraction)
  const manureN = values.applyManure ? num(values.manureRate) * manureFraction : 0

  const cattleAUM = CATTLE_CLASSES.reduce((sum, cls) => {
    const rec = values.cattle[cls.key]
    return sum + ((num(rec.count) * cls.au * num(rec.days)) / 30)
  }, 0)

  const smallRuminantAUM = SMALL_RUMINANT_CLASSES.reduce((sum, cls) => {
    const rec = values.smallRuminants[cls.key]
    return sum + ((num(rec.count) * cls.au * num(rec.days)) / 30)
  }, 0)

  const horseAUM = (num(values.horses.count) * num(values.horses.days)) / 30
  const totalAUM = cattleAUM + smallRuminantAUM + horseAUM
  const aumPerAcre = acres > 0 ? totalAUM / acres : 0

  const lowForageDemand = aumPerAcre * 600
  const lowLivestockNRequirement = lowForageDemand * 0.03
  const highForageDemand = aumPerAcre * 1000
  const highLivestockNRequirement = highForageDemand * 0.03

  const hayCrudeProteinPct = HAY_OPTIONS[values.hayOptionIndex].crudeProteinPct > 0
    ? HAY_OPTIONS[values.hayOptionIndex].crudeProteinPct
    : num(values.hayCustomCrudeProteinPct)
  const hayN = values.includeHaying
    ? num(values.hayHarvestLbAc) * ((hayCrudeProteinPct / 6.25) * 0.01)
    : 0

  const totalNitrogenApplied = syntheticN + manureN
  const totalNitrogenAvailableSoilWater = soilN + irrigationWaterN
  const totalNAllSources = totalNitrogenApplied + totalNitrogenAvailableSoilWater

  return {
    waterAppliedAcFtYear,
    irrigationInches,
    etoDemand,
    irrigationNppm,
    irrigationWaterN,
    soilN,
    syntheticN,
    manureN,
    cattleAUM,
    smallRuminantAUM,
    horseAUM,
    totalAUM,
    aumPerAcre,
    lowForageDemand,
    lowLivestockNRequirement,
    highForageDemand,
    highLivestockNRequirement,
    hayN,
    totalNitrogenApplied,
    totalNitrogenAvailableSoilWater,
    totalNAllSources,
  }
}

function NumberField({ label, value, onChange, help }) {
  return (
    <div className="field">
      <div className="field-label">{label}</div>
      <input className="input" type="number" step="any" value={value} onChange={(e) => onChange(e.target.value)} />
      {help ? <div className="field-help">{help}</div> : null}
    </div>
  )
}

function SelectField({ label, value, onChange, options, getLabel = (o) => o.label, getValue = (_, i) => i }) {
  return (
    <div className="field">
      <div className="field-label">{label}</div>
      <select className="select" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((opt, i) => (
          <option key={i} value={getValue(opt, i)}>{getLabel(opt, i)}</option>
        ))}
      </select>
    </div>
  )
}

function Toggle({ checked, onChange, label }) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  )
}

function ResultRow({ label, value, units, digits = 1, strong = false }) {
  const displayValue = typeof value === 'number' ? round(value, digits) : value
  return (
    <div className={`result-row ${strong ? 'result-strong' : ''}`}>
      <div>{label}</div>
      <div>{displayValue} {units ? <span className="result-muted">{units}</span> : null}</div>
    </div>
  )
}

function AnimalTable({ title, classes, values, onChange }) {
  return (
    <div className="animal-table">
      <div className="sub-title"><strong>{title}</strong></div>
      {classes.map((cls) => (
        <div key={cls.key} className="animal-row">
          <div>{cls.label}</div>
          <NumberField label="Count" value={values[cls.key].count} onChange={(v) => onChange(cls.key, 'count', v)} />
          <NumberField label="Days grazed" value={values[cls.key].days} onChange={(v) => onChange(cls.key, 'days', v)} />
        </div>
      ))}
    </div>
  )
}

function NitrogenBudgetChart({ results }) {
  const data = [
    {
      group: 'Applied & Available Nitrogen',
      synthetic: round(results.syntheticN, 1),
      organic: round(results.manureN, 1),
      irrigation: round(results.irrigationWaterN, 1),
      soil: round(results.soilN, 1),
      livestock: 0,
      hay: 0,
    },
    {
      group: 'Livestock & Forage Nitrogen',
      synthetic: 0,
      organic: 0,
      irrigation: 0,
      soil: 0,
      livestock: round(results.lowLivestockNRequirement, 1),
      hay: round(results.hayN, 1),
    },
  ]

 return (
  <div style={{ width: "100%" }}>
    <div style={{ width: "100%", height: 320 }}>
      <ResponsiveContainer>
        <BarChart
          data={data}
          margin={{ top: 20, right: 20, left: 10, bottom: 10 }}
          barCategoryGap="55%"
        >
          <CartesianGrid strokeDasharray="3 3" />

          {/* Hide default X axis labels */}
          <XAxis dataKey="group" tick={false} axisLine={false} />

          <YAxis
            label={{
              value: "Nitrogen lbs/ac",
              angle: -90,
              position: "insideLeft",
              style: { textAnchor: "middle" }
            }}
          />

          <Tooltip />
          <Legend />

          {/* Nitrogen inputs */}
          <Bar
            dataKey="synthetic"
            name="Synthetic Fertilizer"
            stackId="a"
            fill="#2563eb"
            radius={[4,4,0,0]}
          />
          <Bar
            dataKey="organic"
            name="Compost / Manure"
            stackId="a"
            fill="#16a34a"
          />
          <Bar
            dataKey="irrigation"
            name="Irrigation Water N"
            stackId="a"
            fill="#0ea5e9"
          />
          <Bar
            dataKey="soil"
            name="Soil Nitrogen"
            stackId="a"
            fill="#a16207"
          />

          {/* Livestock demand */}
          <Bar
            dataKey="livestock"
            name="Livestock Nitrogen Demand"
            stackId="b"
            fill="#dc2626"
            radius={[4,4,0,0]}
          />
          <Bar
            dataKey="hay"
            name="Hay Exported Nitrogen"
            stackId="b"
            fill="#f59e0b"
          />

        </BarChart>
      </ResponsiveContainer>
    </div>

    {/* Panel labels under the chart */}
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        textAlign: "center",
        marginTop: 6,
        fontSize: 13,
        fontWeight: 500,
        color: "#334155"
      }}
    >
      <div>Applied + Available N</div>
      <div>Livestock & Hay N</div>
    </div>
  </div>
)
}

export default function App() {
  const reportRef = useRef(null)
  const [values, setValues] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const shared = params.get(URL_PARAM)
      if (shared) {
        const decoded = decodeScenario(shared)
        if (decoded) return { ...DEFAULTS, ...decoded }
      }
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? { ...DEFAULTS, ...JSON.parse(saved) } : DEFAULTS
    } catch {
      return DEFAULTS
    }
  })

  const results = useMemo(() => calculate(values), [values])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(values))
      const params = new URLSearchParams(window.location.search)
      params.set(URL_PARAM, encodeScenario(values))
      const next = `${window.location.pathname}?${params.toString()}`
      window.history.replaceState({}, '', next)
    } catch {}
  }, [values])

  const set = (key, value) => setValues((prev) => ({ ...prev, [key]: value }))
  const setCattle = (key, part, value) => setValues((prev) => ({ ...prev, cattle: { ...prev.cattle, [key]: { ...prev.cattle[key], [part]: value } } }))
  const setSmall = (key, part, value) => setValues((prev) => ({ ...prev, smallRuminants: { ...prev.smallRuminants, [key]: { ...prev.smallRuminants[key], [part]: value } } }))

  const resetForm = () => {
    setValues(DEFAULTS)
    try {
      localStorage.removeItem(STORAGE_KEY)
      const params = new URLSearchParams(window.location.search)
      params.delete(URL_PARAM)
      const next = params.toString() ? `${window.location.pathname}?${params.toString()}` : window.location.pathname
      window.history.replaceState({}, '', next)
    } catch {}
  }

  const printReport = () => window.print()

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      window.alert('Shareable scenario link copied.')
    } catch {
      window.alert(window.location.href)
    }
  }

  const exportPdf = async () => {
    if (!reportRef.current) return
    const canvas = await html2canvas(reportRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      windowWidth: reportRef.current.scrollWidth,
    })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'letter' })
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 24
    const imgWidth = pageWidth - margin * 2
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    let heightLeft = imgHeight
    let position = margin

    pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight)
    heightLeft -= pageHeight - margin * 2

    while (heightLeft > 0) {
      pdf.addPage()
      position = margin - (imgHeight - heightLeft)
      pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight)
      heightLeft -= pageHeight - margin * 2
    }

    pdf.save('ipnmp-report.pdf')
  }

  return (
    <div className="app-shell">
      <div className="container" ref={reportRef}>
        <div className="card hero">
          <div>
            <h1 style={{ margin: '0 0 8px 0' }}>UC Rangelands Iirrigated Pasture Nitrogen and Water Planning App</h1>
            <div className="small">Vite + React version of our irrigated pasture planning tool</div>
          </div>
          <div className="actions no-print">
            <button className="btn" onClick={printReport}>Print report</button>
            <button className="btn" onClick={exportPdf}>Export PDF</button>
            <button className="btn" onClick={copyShareLink}>Copy share link</button>
            <button className="btn" onClick={resetForm}>Reset</button>
          </div>
        </div>

        <div className="grid">
          <div className="stack no-print">
            <div className="card">
              <div className="section-title"><strong>Pasture characteristics and management</strong></div>
              <div className="field-grid" style={{ marginTop: 16 }}>
                <NumberField label="Area of pasture irrigated" value={values.pastureAcres} onChange={(v) => set('pastureAcres', v)} help="acres" />
                <Toggle checked={values.includeIrrigationN} onChange={(v) => set('includeIrrigationN', v)} label="Include nitrogen from irrigation water" />
                <SelectField label="Irrigation units" value={values.irrigationUnit} onChange={(v) => set('irrigationUnit', v)} options={[{ label: 'Acre feet / yr', value: 'acreFeet' }, { label: 'Miners inch', value: 'minersInch' }]} getValue={(o) => o.value} />
                {values.irrigationUnit === 'minersInch' ? <NumberField label="Number of days irrigation water applied" value={values.irrigationDays} onChange={(v) => set('irrigationDays', v)} /> : <div />}
                <NumberField label="Amount of water applied annually" value={values.waterApplied} onChange={(v) => set('waterApplied', v)} help={values.irrigationUnit === 'acreFeet' ? 'acre-feet/year' : 'miners inches'} />
                <div />
                {values.includeIrrigationN ? (
                  <>
                    <SelectField label="Select source of irrigation water" value={String(values.irrigationSourceIndex)} onChange={(v) => set('irrigationSourceIndex', Number(v))} options={IRRIGATION_SOURCES} />
                    {IRRIGATION_SOURCES[values.irrigationSourceIndex].value === 0 ? <NumberField label="Total nitrogen concentration in irrigation water" value={values.irrigationNppmCustom} onChange={(v) => set('irrigationNppmCustom', v)} help="ppm" /> : <div />}
                  </>
                ) : null}
                <Toggle checked={values.estimateETo} onChange={(v) => set('estimateETo', v)} label="Estimate irrigation season ETo demand" />
                <div />
                {values.estimateETo ? (
                  <>
                    <SelectField label="Climatic ETo zone" value={String(values.etoZone)} onChange={(v) => set('etoZone', Number(v))} options={Object.entries(ET_ZONES).map(([k, z]) => ({ key: k, label: z.label }))} getLabel={(o) => o.label} getValue={(o) => o.key} />
                    <div>
                      <div className="field-label" style={{ marginBottom: 8 }}>Months in irrigation season</div>
                      <div className="month-grid">
                        {MONTHS.map((month, i) => (
                          <label key={month} className="month-item">
                            <input
                              type="checkbox"
                              checked={values.irrigationMonths[i]}
                              onChange={(e) => {
                                const next = [...values.irrigationMonths]
                                next[i] = e.target.checked
                                set('irrigationMonths', next)
                              }}
                            />
                            {month}
                          </label>
                        ))}
                      </div>
                    </div>
                  </>
                ) : null}
                <Toggle checked={values.includeSoilN} onChange={(v) => set('includeSoilN', v)} label="Include available soil nitrogen" />
                {values.includeSoilN ? <NumberField label="Plant available soil nitrogen" value={values.soilN} onChange={(v) => set('soilN', v)} help="annualized lb N/acre" /> : <div />}
              </div>
            </div>

            <div className="card">
              <div className="section-title"><strong>Fertilizer applications</strong></div>
              <div className="field-grid" style={{ marginTop: 16 }}>
                <Toggle checked={values.applySyntheticFertilizer} onChange={(v) => set('applySyntheticFertilizer', v)} label="Synthetic fertilizer applied" />
                <div />
                {values.applySyntheticFertilizer ? (
                  <>
                    <NumberField label="Synthetic fertilizer application rate" value={values.syntheticRate} onChange={(v) => set('syntheticRate', v)} help="lb product/acre" />
                    <SelectField label="Fertilizer formulation" value={String(values.syntheticFormulaIndex)} onChange={(v) => set('syntheticFormulaIndex', Number(v))} options={SYNTHETIC_FERTILIZERS} />
                  </>
                ) : null}
                <Toggle checked={values.applyManure} onChange={(v) => set('applyManure', v)} label="Manure or compost applied" />
                <div />
                {values.applyManure ? (
                  <>
                    <NumberField label="Manure or compost rate" value={values.manureRate} onChange={(v) => set('manureRate', v)} help="lb/acre" />
                    <SelectField label="Manure or compost formulation" value={String(values.manureOptionIndex)} onChange={(v) => set('manureOptionIndex', Number(v))} options={MANURE_OPTIONS} />
                    {MANURE_OPTIONS[values.manureOptionIndex].nFraction === 0 ? <NumberField label="Custom nitrogen content" value={values.manureCustomFraction} onChange={(v) => set('manureCustomFraction', v)} help="fraction available N, e.g. 0.012" /> : null}
                  </>
                ) : null}
              </div>
            </div>

            <div className="card">
              <div className="section-title"><strong>Hay characteristics and harvest</strong></div>
              <div className="field-grid" style={{ marginTop: 16 }}>
                <Toggle checked={values.includeHaying} onChange={(v) => set('includeHaying', v)} label="Include haying in plan" />
                <div />
                {values.includeHaying ? (
                  <>
                    <NumberField label="Total annual hay harvest" value={values.hayHarvestLbAc} onChange={(v) => set('hayHarvestLbAc', v)} help="dry hay lb/acre" />
                    <SelectField label="Type and quality of hay" value={String(values.hayOptionIndex)} onChange={(v) => set('hayOptionIndex', Number(v))} options={HAY_OPTIONS} />
                    {HAY_OPTIONS[values.hayOptionIndex].crudeProteinPct === 0 ? <NumberField label="Custom crude protein" value={values.hayCustomCrudeProteinPct} onChange={(v) => set('hayCustomCrudeProteinPct', v)} help="percent crude protein" /> : null}
                  </>
                ) : null}
              </div>
            </div>

            <div className="card">
              <div className="section-title"><strong>Herd characteristics and management</strong></div>
              <div className="stack" style={{ marginTop: 16 }}>
                <AnimalTable title="Cattle" classes={CATTLE_CLASSES} values={values.cattle} onChange={setCattle} />
                <AnimalTable title="Sheep and goats" classes={SMALL_RUMINANT_CLASSES} values={values.smallRuminants} onChange={setSmall} />
                <div className="animal-table">
                  <div className="sub-title"><strong>Horses and mules</strong></div>
                  <div className="field-grid" style={{ marginTop: 12 }}>
                    <NumberField label="Count" value={values.horses.count} onChange={(v) => set('horses', { ...values.horses, count: v })} />
                    <NumberField label="Days grazed" value={values.horses.days} onChange={(v) => set('horses', { ...values.horses, days: v })} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="stack">
            <div className="card">
              <h2 style={{ marginTop: 0, marginBottom: 6 }}>Results</h2>
              <div className="small" style={{ marginBottom: 16 }}>This information can be used to complete an Irrigation and Nitrogen Management Plan worksheet.</div>
              <div className="no-print"><NitrogenBudgetChart results={results} /></div>
              <h3 style={{ marginBottom: 8 }}>Irrigated Pasture and Herd Nitrogen Management Planning</h3>
              <div className="small" style={{ marginBottom: 16 }}>Below is summary of irrigated pasture management and herd characteristics.</div>

              <ResultRow label="Crop" value="Irrigated pasture forage and livestock" units="" digits={0} />
              <ResultRow label="Predicted stocking rate" value={results.aumPerAcre} units="AUMs per acre" digits={1} />
              <ResultRow label="Estimated forage required by livestock" value={results.highForageDemand} units="lbs per acre" digits={0} />
              <ResultRow label="Nitrogen in required forage for livestock" value={results.lowLivestockNRequirement} units="lbs per acre" digits={0} strong />
              <ResultRow label="Harvested hay" value={values.includeHaying ? num(values.hayHarvestLbAc) : 0} units="lbs per acre" digits={0} />
              <ResultRow label="Projected nitrogen exported as hay" value={results.hayN} units="lbs per acre" digits={0} strong />
              <ResultRow label="Irrigated acres" value={num(values.pastureAcres)} units="" digits={0} />
              <ResultRow label="Volume of water applied to pasture" value={results.waterAppliedAcFtYear} units="acre ft per year" digits={0} />
              <ResultRow label="Irrigation water applied" value={results.irrigationInches} units="inches" digits={1} strong />
              <ResultRow label="Average ETo for irrigation season" value={results.etoDemand} units="inches" digits={2} strong />

              <div className="divider">
                <h4 style={{ marginTop: 0, marginBottom: 8 }}>Nitrogen Sources</h4>
                <div className="small" style={{ marginBottom: 12 }}>Below is a summary of the nitrogen sources including fertilizers applied, organic amendments, and available nitrogen in soil and irrigation water.</div>
                <ResultRow label="Dry/Liquid synthetic nitrogen fertilizers applied" value={results.syntheticN} units="lbs per acre" digits={1} />
                <ResultRow label="Nitrogen from applied manure/compost" value={results.manureN} units="lbs per acre" digits={1} />
                <ResultRow label="Total nitrogen applied" value={results.totalNitrogenApplied} units="lbs per acre" digits={0} strong />
                <ResultRow label="Available nitrogen in soil root zone" value={results.soilN} units="lbs per acre" digits={0} />
                <ResultRow label="Available nitrogen from irrigation water" value={results.irrigationWaterN} units="lbs per acre" digits={1} />
                <ResultRow label="Total nitrogen available from soil and water" value={results.totalNitrogenAvailableSoilWater} units="lbs per acre" digits={0} strong />
                <ResultRow label="Total nitrogen from all sources" value={results.totalNAllSources} units="lbs N per acre" digits={0} strong />
              </div>
            </div>

            <div className="card summary-card">
              <div><strong>Pasture Management Summary</strong></div>
              <div className="tiny" style={{ marginTop: 8, marginBottom: 10 }}>
                Vite deployment testing version subject to change, including the accuracy of generated results. Please reach out to djeastburn@ucdavis.edu or your local UC Cooperative Extension Advisor for further assistance.
              </div>
              <div className="small">Pasture area: {round(num(values.pastureAcres), 1)} acres</div>
              <div className="small">Water applied: {round(results.waterAppliedAcFtYear, 1)} ac-ft/year ({round(results.irrigationInches, 1)} inches)</div>
              <div className="small">Irrigation season ETo: {round(results.etoDemand, 2)} inches</div>
              <div className="small">Stocking intensity: {round(results.aumPerAcre, 1)} AUM/ac</div>
              <div className="small">Total nitrogen from all sources: {round(results.totalNAllSources, 0)} lb N/ac</div>
              <div className="small">Low / high livestock N requirement: {round(results.lowLivestockNRequirement, 0)} / {round(results.highLivestockNRequirement, 0)} lb N/ac</div>
              {values.includeHaying ? <div className="small">Nitrogen exported in hay: {round(results.hayN, 1)} lb N/ac</div> : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

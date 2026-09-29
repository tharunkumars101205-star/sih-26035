import React, { useState, useMemo } from 'react';
import {
  Scale,
  ArrowLeft,
  Save,
  AlertTriangle,
  CheckCircle2,
  Building2,
  Info,
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { AccuracyClass, InstrumentType, WeighingInstrument } from '../../types';
import { validateInstrumentParameters } from '../../calculations/nawiEngine';

interface NewInstrumentPageProps {
  onNavigate: (path: string) => void;
}

export const NewInstrumentPage: React.FC<NewInstrumentPageProps> = ({ onNavigate }) => {
  const manufacturers = storageService.getManufacturers();

  // Form State
  const [manufacturerId, setManufacturerId] = useState(manufacturers[0]?.id || '');
  const [modelDesignation, setModelDesignation] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [instrumentType, setInstrumentType] = useState<InstrumentType>('electronic_counter_scale');
  const [accuracyClass, setAccuracyClass] = useState<AccuracyClass>('III');
  const [maxCapacity, setMaxCapacity] = useState<string>('15');
  const [minCapacity, setMinCapacity] = useState<string>('0.1');
  const [verificationInterval, setVerificationInterval] = useState<string>('0.005');
  const [scaleInterval, setScaleInterval] = useState<string>('0.005');
  const [measurementUnit, setMeasurementUnit] = useState<'kg' | 'g' | 't' | 'mg'>('kg');
  const [operatingTempMin, setOperatingTempMin] = useState<string>('-10');
  const [operatingTempMax, setOperatingTempMax] = useState<string>('40');
  const [powerSupply, setPowerSupply] = useState('230 V AC, 50 Hz with backup battery');
  const [laboratoryLocation, setLaboratoryLocation] = useState('Metrology Testing Bay 2');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Numerical calculations
  const parsedMax = parseFloat(maxCapacity) || 0;
  const parsedMin = parseFloat(minCapacity) || 0;
  const parsedE = parseFloat(verificationInterval) || 0;
  const parsedD = parseFloat(scaleInterval) || 0;

  const calculatedN = useMemo(() => {
    if (parsedMax > 0 && parsedE > 0) {
      return Math.round(parsedMax / parsedE);
    }
    return 0;
  }, [parsedMax, parsedE]);

  // Real-time Metrological Validation
  const validation = useMemo(() => {
    return validateInstrumentParameters({
      maxCapacity: parsedMax,
      minCapacity: parsedMin,
      scaleInterval: parsedD,
      verificationInterval: parsedE,
      accuracyClass,
    });
  }, [parsedMax, parsedMin, parsedD, parsedE, accuracyClass]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validation.isValid) {
      setFormError('Please resolve all metrological validation errors before registering the instrument.');
      return;
    }
    setFormError(null);

    const selectedMfr = manufacturers.find((m) => m.id === manufacturerId);
    const newId = `inst_${Date.now()}`;
    const instrumentId = `NAWI-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const newInst: WeighingInstrument = {
      id: newId,
      instrumentId,
      manufacturerId,
      manufacturerName: selectedMfr?.name || 'Authorized Manufacturer',
      modelDesignation: modelDesignation.trim() || 'Standard NAWI Model',
      serialNumber: serialNumber.trim() || `SN-${Date.now().toString().slice(-6)}`,
      type: instrumentType,
      accuracyClass,
      maxCapacity: parsedMax,
      minCapacity: parsedMin,
      scaleInterval: parsedD,
      verificationInterval: parsedE,
      calculatedN,
      measurementUnit,
      operatingTempMin: parseFloat(operatingTempMin) || -10,
      operatingTempMax: parseFloat(operatingTempMax) || 40,
      powerSupply,
      laboratoryLocation,
      registrationDate: new Date().toISOString().split('T')[0],
      status: 'registered',
      notes,
    };

    storageService.saveInstrument(newInst);
    onNavigate(`/instruments/${newInst.id}`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('/instruments')}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Register New Weighing Instrument (NAWI)
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter manufacturer, technical parameters, and verification scale intervals as per OIML R 76-1.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {formError && (
          <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800 flex items-center gap-2">
            <AlertTriangle size={15} className="text-rose-600 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* Metrological Validation Feedback Box */}
        {(!validation.isValid || validation.warnings.length > 0) && (
          <div className="p-4 rounded-lg border bg-amber-50/70 border-amber-200 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-900">
              <AlertTriangle size={15} className="text-amber-700" />
              <span>OIML R 76-1 Metrological Parameter Verification</span>
            </div>
            {validation.errors.map((err, i) => (
              <div key={i} className="text-rose-700 flex items-center gap-1.5 pl-5">
                <span>•</span>
                <span>{err}</span>
              </div>
            ))}
            {validation.warnings.map((warn, i) => (
              <div key={i} className="text-amber-800 flex items-center gap-1.5 pl-5">
                <span>•</span>
                <span>{warn}</span>
              </div>
            ))}
          </div>
        )}

        {/* 1. Manufacturer & Identification */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-[11px] border-b border-slate-100 pb-2">
            1. Manufacturer & Identification
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Manufacturer <span className="text-rose-500">*</span>
              </label>
              <select
                value={manufacturerId}
                onChange={(e) => setManufacturerId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded bg-white text-slate-900 focus:outline-none focus:border-cyan-500"
              >
                {manufacturers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.city}, {m.country})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Instrument Category / Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={instrumentType}
                onChange={(e) => setInstrumentType(e.target.value as InstrumentType)}
                className="w-full px-3 py-2 border border-slate-200 rounded bg-white text-slate-900 focus:outline-none focus:border-cyan-500"
              >
                <option value="electronic_counter_scale">Electronic Counter / Price-Computing Scale</option>
                <option value="bench_platform_scale">Bench & Platform Scale</option>
                <option value="heavy_platform_scale">Heavy-Duty Industrial Platform Scale</option>
                <option value="weighbridge_truck_scale">Electronic Road Weighbridge (Truck Scale)</option>
                <option value="precision_laboratory_balance">Precision Analytical Laboratory Balance</option>
                <option value="crane_hanging_scale">Crane / Hanging Scale</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Model Designation <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. APX-3000P or Falcon-60T"
                value={modelDesignation}
                onChange={(e) => setModelDesignation(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Serial Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. SN-2026-98124"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        </div>

        {/* 2. Metrological Characteristics */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-[11px]">
              2. Metrological Characteristics (OIML R 76-1 Clause 3)
            </h2>
            <div className="font-mono text-xs text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
              Calculated n = <span className="font-bold">{calculatedN.toLocaleString()}</span> intervals
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Accuracy Class <span className="text-rose-500">*</span>
              </label>
              <select
                value={accuracyClass}
                onChange={(e) => setAccuracyClass(e.target.value as AccuracyClass)}
                className="w-full px-3 py-2 border border-slate-200 rounded bg-white text-slate-900 font-semibold focus:outline-none focus:border-cyan-500"
              >
                <option value="I">Class I — Special Accuracy (n ≥ 50,000)</option>
                <option value="II">Class II — High Accuracy (100 ≤ n ≤ 100,000)</option>
                <option value="III">Class III — Medium Accuracy (100 ≤ n ≤ 10,000)</option>
                <option value="IIII">Class IIII — Ordinary Accuracy (100 ≤ n ≤ 1,000)</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Measurement Unit <span className="text-rose-500">*</span>
              </label>
              <select
                value={measurementUnit}
                onChange={(e) => setMeasurementUnit(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-200 rounded bg-white text-slate-900 font-mono focus:outline-none focus:border-cyan-500"
              >
                <option value="kg">Kilogram (kg)</option>
                <option value="g">Gram (g)</option>
                <option value="t">Tonne (t)</option>
                <option value="mg">Milligram (mg)</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Maximum Capacity (Max) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                required
                value={maxCapacity}
                onChange={(e) => setMaxCapacity(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded text-slate-900 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Minimum Capacity (Min) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                required
                value={minCapacity}
                onChange={(e) => setMinCapacity(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded text-slate-900 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Verification Scale Interval (e) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                required
                value={verificationInterval}
                onChange={(e) => setVerificationInterval(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded text-slate-900 font-mono focus:outline-none focus:border-cyan-500"
              />
              <span className="text-[10px] text-slate-500">Determines MPE tolerance</span>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Actual Scale Interval (d) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                required
                value={scaleInterval}
                onChange={(e) => setScaleInterval(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded text-slate-900 font-mono focus:outline-none focus:border-cyan-500"
              />
              <span className="text-[10px] text-slate-500">d ≤ e (often d = e)</span>
            </div>
          </div>
        </div>

        {/* 3. Operational & Environmental Conditions */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-[11px] border-b border-slate-100 pb-2">
            3. Operational & Environmental Specifications
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Operating Temp Min (°C)
              </label>
              <input
                type="number"
                value={operatingTempMin}
                onChange={(e) => setOperatingTempMin(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded text-slate-900 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Operating Temp Max (°C)
              </label>
              <input
                type="number"
                value={operatingTempMax}
                onChange={(e) => setOperatingTempMax(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded text-slate-900 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Laboratory Location / Test Bay
              </label>
              <input
                type="text"
                value={laboratoryLocation}
                onChange={(e) => setLaboratoryLocation(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="sm:col-span-2 md:col-span-3">
              <label className="block font-medium text-slate-700 mb-1">
                Power Supply & Auxiliary Equipment
              </label>
              <input
                type="text"
                value={powerSupply}
                onChange={(e) => setPowerSupply(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="sm:col-span-2 md:col-span-3">
              <label className="block font-medium text-slate-700 mb-1">
                Additional Technical Remarks
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Sealing method, firmware checksum, load receptor dimensions..."
                className="w-full px-3 py-2 border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex items-center justify-end gap-3 pt-3">
          <button
            type="button"
            onClick={() => onNavigate('/instruments')}
            className="px-4 py-2 text-xs font-medium border border-slate-300 rounded text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!validation.isValid}
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-slate-900 rounded hover:bg-slate-800 disabled:opacity-50 transition-colors shadow-xs"
          >
            <Save size={14} />
            <span>Register Instrument</span>
          </button>
        </div>
      </form>
    </div>
  );
};

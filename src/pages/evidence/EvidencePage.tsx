import React, { useState } from 'react';
import {
  FolderArchive,
  Upload,
  Search,
  FileText,
  Image,
  File,
  Plus,
  ArrowRight,
  ShieldCheck,
  Download,
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { EvidenceFile } from '../../types';

interface EvidencePageProps {
  onNavigate: (path: string) => void;
}

export const EvidencePage: React.FC<EvidencePageProps> = ({ onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  // New file form state
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState<EvidenceFile['fileType']>('image/jpeg');
  const [fileSizeBytes, setFileSizeBytes] = useState<number>(1048576);
  const [fileDataUrl, setFileDataUrl] = useState<string | undefined>(undefined);
  const [description, setDescription] = useState('');
  const [associatedType, setAssociatedType] = useState<EvidenceFile['associatedType']>('evaluation');
  const [associatedId, setAssociatedId] = useState('');
  const [previewEvidence, setPreviewEvidence] = useState<EvidenceFile | null>(null);

  const evidenceList = storageService.getEvidence();
  const currentUser = storageService.getCurrentUser();
  const evaluations = storageService.getEvaluations();
  const instruments = storageService.getInstruments();

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!fileName) {
      setFileName(file.name);
    }
    setFileSizeBytes(file.size);

    if (file.type.startsWith('image/')) {
      setFileType(file.type as any);
      const reader = new FileReader();
      reader.onload = (event) => {
        setFileDataUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else if (file.type === 'application/pdf') {
      setFileType('application/pdf');
    } else {
      setFileType('document');
    }
  };

  const filtered = evidenceList.filter((ev) => {
    const matchesSearch =
      ev.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.uploaderName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === 'all' || ev.associatedType === filterType;
    return matchesSearch && matchesType;
  });

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName.trim()) return;

    const newEvidence: EvidenceFile = {
      id: `ev_${Date.now()}`,
      name: fileName.trim(),
      fileType,
      sizeBytes: fileSizeBytes || Math.floor(500000 + Math.random() * 2000000),
      dataUrl: fileDataUrl,
      description: description.trim() || 'Supporting metrological documentation.',
      associatedType,
      associatedId: associatedId || evaluations[0]?.id || 'inst_01',
      uploaderName: currentUser.name,
      uploadedAt: new Date().toISOString(),
    };

    storageService.addEvidence(newEvidence);
    setUploadModalOpen(false);
    setFileName('');
    setDescription('');
    setFileDataUrl(undefined);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Evidence & Document Management
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Photographic evidence, rating plates, calibration certificates, and calibration logs associated with evaluations.
          </p>
        </div>

        <button
          onClick={() => setUploadModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded hover:bg-slate-800 transition-colors shadow-xs shrink-0"
        >
          <Upload size={14} />
          <span>Upload Supporting File</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search documents by name, description, or uploader..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs border border-slate-200 rounded focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Associated With:</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-200 rounded bg-white text-slate-700 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Attachments</option>
            <option value="instrument">Instrument Specifications</option>
            <option value="evaluation">Type Evaluation Plan</option>
            <option value="test_procedure">Test Procedure</option>
            <option value="report">Final Report</option>
          </select>
        </div>
      </div>

      {/* Evidence Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500">
            No evidence records found.
          </div>
        ) : (
          filtered.map((ev) => {
            const isImage = ev.fileType.startsWith('image/');
            const isPdf = ev.fileType === 'application/pdf';

            return (
              <div
                key={ev.id}
                onClick={() => setPreviewEvidence(ev)}
                className="bg-white rounded-lg border border-slate-200 shadow-xs p-4 flex flex-col justify-between space-y-3 hover:border-cyan-500 transition-colors cursor-pointer group"
              >
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    {ev.dataUrl ? (
                      <div className="h-12 w-12 rounded bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                        <img
                          src={ev.dataUrl}
                          alt={ev.name}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                    ) : (
                      <div className="h-10 w-10 rounded bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                        {isImage ? (
                          <Image size={20} className="text-teal-700" />
                        ) : isPdf ? (
                          <FileText size={20} className="text-rose-700" />
                        ) : (
                          <File size={20} />
                        )}
                      </div>
                    )}

                    <div className="truncate">
                      <div className="text-xs font-bold text-slate-900 truncate group-hover:text-teal-800 transition-colors" title={ev.name}>
                        {ev.name}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {(ev.sizeBytes / 1024 / 1024).toFixed(2)} MB · {ev.fileType.toUpperCase()}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2">{ev.description}</p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="capitalize font-medium text-slate-600">
                    {ev.associatedType} · {ev.uploaderName.split(' ')[0]}
                  </span>
                  <span>{new Date(ev.uploadedAt).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Image / Evidence Full Preview Modal */}
      {previewEvidence && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">{previewEvidence.name}</h2>
                <div className="text-[11px] text-slate-500 font-mono">
                  {previewEvidence.fileType} · {(previewEvidence.sizeBytes / 1024 / 1024).toFixed(2)} MB
                </div>
              </div>
              <button
                onClick={() => setPreviewEvidence(null)}
                className="text-slate-400 hover:text-slate-700 font-bold p-1"
              >
                ✕
              </button>
            </div>

            {previewEvidence.dataUrl ? (
              <div className="max-h-[60vh] overflow-hidden rounded border border-slate-200 bg-slate-50 flex items-center justify-center">
                <img
                  src={previewEvidence.dataUrl}
                  alt={previewEvidence.name}
                  className="max-h-[58vh] max-w-full object-contain"
                />
              </div>
            ) : (
              <div className="p-8 bg-slate-50 rounded border border-dashed border-slate-300 text-center space-y-2">
                <FileText size={48} className="mx-auto text-slate-400" />
                <p className="text-xs font-semibold text-slate-700">{previewEvidence.name}</p>
                <p className="text-[11px] text-slate-500">
                  Standard metrological test artifact stored with traceable evaluation records.
                </p>
              </div>
            )}

            <div className="text-xs text-slate-700 bg-slate-50 p-3 rounded border border-slate-200">
              <span className="font-semibold block text-slate-900 mb-0.5">Description & Scope:</span>
              {previewEvidence.description}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setPreviewEvidence(null)}
                className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded hover:bg-slate-800"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h2 className="text-sm font-bold text-slate-900">Upload Supporting Evidence</h2>
              <button
                onClick={() => setUploadModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              {/* File input */}
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Choose Local File / Photograph
                </label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileInput}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                />
              </div>

              {fileDataUrl && (
                <div className="p-2 border border-slate-200 rounded bg-slate-50 flex items-center gap-3">
                  <img
                    src={fileDataUrl}
                    alt="Preview"
                    className="h-14 w-14 object-cover rounded border border-slate-300"
                  />
                  <div className="text-[11px] text-slate-600">
                    <span className="font-semibold text-slate-900 block truncate">{fileName}</span>
                    <span className="text-emerald-700">✓ Image ready for upload</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  File Title / Identifier <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Platform_Corner_Loading_Photo.jpg"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">File Type</label>
                  <select
                    value={fileType}
                    onChange={(e) => setFileType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded bg-white text-slate-900 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="image/jpeg">JPEG Image</option>
                    <option value="image/png">PNG Image</option>
                    <option value="application/pdf">PDF Document</option>
                    <option value="document">Other Certificate</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Associate With</label>
                  <select
                    value={associatedType}
                    onChange={(e) => setAssociatedType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded bg-white text-slate-900 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="evaluation">Type Evaluation</option>
                    <option value="instrument">Instrument Spec</option>
                    <option value="test_procedure">Test Procedure</option>
                    <option value="report">Final Report</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Target Record Reference
                </label>
                <select
                  value={associatedId}
                  onChange={(e) => setAssociatedId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded bg-white text-slate-900 focus:outline-none focus:border-cyan-500"
                >
                  {evaluations.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.evaluationNumber} ({ev.instrumentSnapshot.modelDesignation})
                    </option>
                  ))}
                  {instruments.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.instrumentId} ({i.modelDesignation})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Evidence Description & Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Explain how this document corroborates compliance..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 text-white rounded font-semibold hover:bg-slate-800"
                >
                  Save Attachment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

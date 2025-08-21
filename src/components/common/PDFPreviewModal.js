import React, { useEffect, useMemo, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

// Configurer le worker PDF.js en self-host via public/
pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`;

const PDFPreviewModal = ({ isOpen, onClose, fileUrl, title, authToken }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setNumPages(null);
      setPageNumber(1);
      setError(null);
    }
  }, [isOpen]);

  const file = useMemo(() => {
    if (!fileUrl) {
      return null;
    }
    const headers = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    // Supporte les URLs absolues et relatives à l'API
    return { url: fileUrl, httpHeaders: headers, withCredentials: false };
  }, [fileUrl, authToken]);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setError(null);
  };

  const onDocumentLoadError = (err) => {
    setError(err?.message || 'Impossible de charger le PDF.');
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white w-full max-w-4xl rounded-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="text-lg font-semibold text-gray-800 truncate" title={title || 'Aperçu du document PDF'}>
            {title || 'Aperçu du document PDF'}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 px-2 py-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Viewer */}
        <div className="flex-1 overflow-auto bg-gray-50 flex items-center justify-center">
          {error ? (
            <div className="p-6 text-center">
              <p className="text-red-600 mb-2">{error}</p>
              {fileUrl ? (
                <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  Ouvrir dans un nouvel onglet
                </a>
              ) : null}
            </div>
          ) : (
            <Document file={file} onLoadSuccess={onDocumentLoadSuccess} onLoadError={onDocumentLoadError} loading={
              <div className="py-12 text-gray-600">Chargement du PDF...</div>
            }>
              <Page pageNumber={pageNumber} width={800} renderTextLayer={false} renderAnnotationLayer={false} />
            </Document>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t flex items-center justify-between bg-white">
          <div className="text-sm text-gray-600">
            {numPages ? (
              <span>Page {pageNumber} / {numPages}</span>
            ) : (
              <span>Aucun aperçu disponible</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
              disabled={!numPages || pageNumber <= 1}
              className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded disabled:opacity-50"
            >
              Précédent
            </button>
            <button
              onClick={() => setPageNumber((p) => (numPages ? Math.min(numPages, p + 1) : p))}
              disabled={!numPages || pageNumber >= numPages}
              className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded disabled:opacity-50"
            >
              Suivant
            </button>
            {fileUrl ? (
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Télécharger
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFPreviewModal;



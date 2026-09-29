/**
 * METRALAB - Digital NAWI Testing, Compliance & Report Generation Platform
 * Smart India Hackathon 2026 | Problem Statement ID: SIH26035
 * Ministry of Consumer Affairs, Food & Public Distribution | Team: Black Squad
 */

import React, { useState, useEffect } from 'react';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { InstrumentListPage } from './pages/instruments/InstrumentListPage';
import { NewInstrumentPage } from './pages/instruments/NewInstrumentPage';
import { InstrumentDetailPage } from './pages/instruments/InstrumentDetailPage';
import { EvaluationListPage } from './pages/evaluations/EvaluationListPage';
import { NewEvaluationWizardPage } from './pages/evaluations/NewEvaluationWizardPage';
import { TestExecutionPage } from './pages/testing/TestExecutionPage';
import { CalculationsPage } from './pages/calculations/CalculationsPage';
import { ReviewWorkspacePage } from './pages/reviews/ReviewWorkspacePage';
import { EvidencePage } from './pages/evidence/EvidencePage';
import { ReportRepositoryPage } from './pages/reports/ReportRepositoryPage';
import { ReportDetailPage } from './pages/reports/ReportDetailPage';
import { HistoryPage } from './pages/history/HistoryPage';
import { RulesLibraryPage } from './pages/rules/RulesLibraryPage';
import { AnalyticsPage } from './pages/analytics/AnalyticsPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { DocumentationPage } from './pages/documentation/DocumentationPage';

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname || '/dashboard';
  });

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/dashboard');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo(0, 0);
  };

  // Route matching
  const renderCurrentPage = () => {
    const [pathOnly, queryString] = currentPath.split('?');
    const queryParams = new URLSearchParams(queryString || '');

    if (pathOnly === '/' || pathOnly === '/dashboard') {
      return <DashboardPage onNavigate={handleNavigate} />;
    }

    if (pathOnly === '/instruments/new') {
      return <NewInstrumentPage onNavigate={handleNavigate} />;
    }

    if (pathOnly.startsWith('/instruments/')) {
      const id = pathOnly.replace('/instruments/', '');
      return <InstrumentDetailPage id={id} onNavigate={handleNavigate} />;
    }

    if (pathOnly === '/instruments') {
      return <InstrumentListPage onNavigate={handleNavigate} />;
    }

    if (pathOnly === '/evaluations/new') {
      const initialInstId = queryParams.get('instrumentId') || undefined;
      return (
        <NewEvaluationWizardPage
          initialInstrumentId={initialInstId}
          onNavigate={handleNavigate}
        />
      );
    }

    if (pathOnly.startsWith('/evaluations/')) {
      const evalId = pathOnly.replace('/evaluations/', '');
      return <TestExecutionPage evaluationId={evalId} onNavigate={handleNavigate} />;
    }

    if (pathOnly === '/evaluations') {
      return <EvaluationListPage onNavigate={handleNavigate} />;
    }

    if (pathOnly.startsWith('/test-execution/')) {
      const evalId = pathOnly.replace('/test-execution/', '');
      return <TestExecutionPage evaluationId={evalId} onNavigate={handleNavigate} />;
    }

    if (pathOnly === '/test-execution') {
      return <TestExecutionPage onNavigate={handleNavigate} />;
    }

    if (pathOnly.startsWith('/calculations/')) {
      const evalId = pathOnly.replace('/calculations/', '');
      return <CalculationsPage evaluationId={evalId} onNavigate={handleNavigate} />;
    }

    if (pathOnly === '/calculations') {
      return <CalculationsPage onNavigate={handleNavigate} />;
    }

    if (pathOnly === '/reviews') {
      return <ReviewWorkspacePage onNavigate={handleNavigate} />;
    }

    if (pathOnly === '/evidence') {
      return <EvidencePage onNavigate={handleNavigate} />;
    }

    if (pathOnly.startsWith('/reports/')) {
      const reportId = pathOnly.replace('/reports/', '');
      return <ReportDetailPage id={reportId} onNavigate={handleNavigate} />;
    }

    if (pathOnly === '/reports') {
      return <ReportRepositoryPage onNavigate={handleNavigate} />;
    }

    if (pathOnly === '/history') {
      return <HistoryPage onNavigate={handleNavigate} />;
    }

    if (pathOnly === '/rules') {
      return <RulesLibraryPage />;
    }

    if (pathOnly === '/analytics') {
      return <AnalyticsPage />;
    }

    if (pathOnly === '/settings') {
      return <SettingsPage onNavigate={handleNavigate} />;
    }

    if (pathOnly === '/documentation') {
      return <DocumentationPage />;
    }

    // Default 404 fallback
    return (
      <div className="p-12 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">404 - Page Not Found</h2>
        <p className="text-xs text-slate-500">The requested metrological page does not exist.</p>
        <button
          onClick={() => handleNavigate('/dashboard')}
          className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded hover:bg-slate-800"
        >
          Return to Dashboard
        </button>
      </div>
    );
  };

  return (
    <AppLayout currentPath={currentPath} onNavigate={handleNavigate}>
      {renderCurrentPage()}
    </AppLayout>
  );
}

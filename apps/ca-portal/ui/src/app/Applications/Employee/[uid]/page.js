'use client';

import CandidateAndEmployeeApplicationsView from '@/components/jobs/CandidateAndEmployeeApplicationsView';
// Assuming you have a different API function for employees
import { getCandidateApplicationsForCandidate } from '@/services/db-apis'; 

export default function EmployeeApplicationsPage() {
  return (
    <CandidateAndEmployeeApplicationsView
      pageTitle="My Applications"
      pageSubtitle="Track the status of positions you've applied for."
      userRole="EMPLOYEE"
      fetchFunction={getCandidateApplicationsForCandidate}
      cardViewAs="EMPLOYEE"
    />
  );
}
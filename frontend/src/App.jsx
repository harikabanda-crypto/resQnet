import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from './contexts/AppContext.jsx'

// Public pages
import LandingPage from './pages/LandingPage.jsx'
import ResQNetAppPage from './pages/ResQNetAppPage.jsx'
import LoginPage from './pages/LoginPage.jsx'

// Citizen
import CitizenLayout from './pages/citizen/CitizenLayout.jsx'
import CitizenHome from './pages/citizen/CitizenHome.jsx'
import CitizenMap from './pages/citizen/CitizenMap.jsx'
import CitizenRequest from './pages/citizen/CitizenRequest.jsx'
import CitizenRelief from './pages/citizen/CitizenRelief.jsx'
import CitizenProfile from './pages/citizen/CitizenProfile.jsx'

// Authority
import AuthorityLayout from './pages/authority/AuthorityLayout.jsx'
import AuthorityDashboard from './pages/authority/AuthorityDashboard.jsx'
import AuthorityMap from './pages/authority/AuthorityMap.jsx'
import AuthorityRequests from './pages/authority/AuthorityRequests.jsx'
import AuthorityResources from './pages/authority/AuthorityResources.jsx'
import AuthorityTeams from './pages/authority/AuthorityTeams.jsx'
import AuthorityShelters from './pages/authority/AuthorityShelters.jsx'
import AuthorityAI from './pages/authority/AuthorityAI.jsx'
import AuthorityAnalytics from './pages/authority/AuthorityAnalytics.jsx'
import AuthorityAlerts from './pages/authority/AuthorityAlerts.jsx'

// NGO
import NGOLayout from './pages/ngo/NGOLayout.jsx'
import NGODashboard from './pages/ngo/NGODashboard.jsx'
import NGOInventory from './pages/ngo/NGOInventory.jsx'
import NGORequests from './pages/ngo/NGORequests.jsx'
import NGOHistory from './pages/ngo/NGOHistory.jsx'

// Volunteer
import VolunteerLayout from './pages/volunteer/VolunteerLayout.jsx'
import VolunteerDashboard from './pages/volunteer/VolunteerDashboard.jsx'
import VolunteerTasks from './pages/volunteer/VolunteerTasks.jsx'
import VolunteerMap from './pages/volunteer/VolunteerMap.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          {/* Landing */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/resqnet" element={<ResQNetAppPage />} />
          <Route path="/login/:role" element={<LoginPage />} />

          {/* Citizen (mobile phone UI) */}
          <Route path="/citizen" element={<CitizenLayout />}>
            <Route index element={<Navigate to="home" replace />} />
            <Route path="home" element={<CitizenHome />} />
            <Route path="map" element={<CitizenMap />} />
            <Route path="request" element={<CitizenRequest />} />
            <Route path="relief" element={<CitizenRelief />} />
            <Route path="profile" element={<CitizenProfile />} />
          </Route>

          {/* Authority (full desktop dashboard) */}
          <Route path="/authority" element={<AuthorityLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AuthorityDashboard />} />
            <Route path="map" element={<AuthorityMap />} />
            <Route path="requests" element={<AuthorityRequests />} />
            <Route path="resources" element={<AuthorityResources />} />
            <Route path="teams" element={<AuthorityTeams />} />
            <Route path="shelters" element={<AuthorityShelters />} />
            <Route path="ai" element={<AuthorityAI />} />
            <Route path="analytics" element={<AuthorityAnalytics />} />
            <Route path="alerts" element={<AuthorityAlerts />} />
          </Route>

          {/* NGO */}
          <Route path="/ngo" element={<NGOLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<NGODashboard />} />
            <Route path="inventory" element={<NGOInventory />} />
            <Route path="requests" element={<NGORequests />} />
            <Route path="history" element={<NGOHistory />} />
          </Route>

          {/* Volunteer */}
          <Route path="/volunteer" element={<VolunteerLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<VolunteerDashboard />} />
            <Route path="tasks" element={<VolunteerTasks />} />
            <Route path="map" element={<VolunteerMap />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppProvider>
    </BrowserRouter>
  )
}

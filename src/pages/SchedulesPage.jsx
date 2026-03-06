import React, { useState, useEffect, useMemo } from 'react';
import { Card, Button, Badge, Select, Input, Toast, Loading, AccessDenied } from '../components/ui';
import { ViewModal, AlertModal, FormModal } from '../components/modals';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { hasPermission } from '../utils/permissions';

const SchedulesPage = () => {
  const { user: currentUser } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, 1 = next week, -1 = previous week
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
  const [cancellingSchedule, setCancellingSchedule] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [updatingSchedule, setUpdatingSchedule] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusCancelReason, setStatusCancelReason] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loadingSchedules, setLoadingSchedules] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', variant: 'success' });
  // Load schedules from backend API
  const loadSchedules = async () => {
    try {
      setLoadingSchedules(true);
      const response = await api.schedules.getAll();
      
      // Handle paginated response
      let fetchedSchedules = [];
      if (response.success && response.data) {
        if (response.data.data && Array.isArray(response.data.data)) {
          // Paginated response
          fetchedSchedules = response.data.data;
        } else if (Array.isArray(response.data)) {
          // Direct array response
          fetchedSchedules = response.data;
        }
      }
      
      // Transform backend data to match frontend format
      const transformedSchedules = fetchedSchedules.map(schedule => {
        // Extract date - API returns "2026-03-04T00:00:00.000000Z", we need "2026-03-04"
        let dateOnly = schedule.date;
        if (dateOnly && typeof dateOnly === 'string' && dateOnly.includes('T')) {
          dateOnly = dateOnly.split('T')[0];  // Simple split by 'T'
        }
        
        // console.log(` Extracting date for ${schedule.schedule_id}:`, {
        //   original: schedule.date,
        //   extracted: dateOnly
        // });
        
        // Calculate the CORRECT day name from the date
        let correctDayName = schedule.day;
        if (dateOnly && dateOnly.match(/^\d{4}-\d{2}-\d{2}$/)) {
          const [year, month, day] = dateOnly.split('-').map(Number);
          const dateObj = new Date(Date.UTC(year, month - 1, day));
          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          correctDayName = dayNames[dateObj.getUTCDay()];
        }
        
        return {
          id: schedule.id,
          scheduleId: schedule.schedule_id,
          day: correctDayName,  // Use calculated day name, not database value
          dbDay: schedule.day,  // Keep original for reference
          date: dateOnly,  // Use properly extracted date (YYYY-MM-DD only)
          status: schedule.status,
          route: schedule.stops || [], // 'stops' from API = 'route' in frontend
          routeId: schedule.route_id,
          routeName: schedule.route?.name || '',
          startTime: schedule.start_time,
          endTime: schedule.end_time,
          cancelReason: schedule.cancel_reason,
          notes: schedule.notes,
          createdById: schedule.created_by_id,
          assignedDriverId: schedule.assigned_driver_id,
          assignedDriver: schedule.assigned_driver,
          createdBy: schedule.created_by,
          stops: schedule.stops || [],
          totalStops: schedule.total_stops,
          completedStops: schedule.completed_stops,
          progressPercentage: schedule.progress_percentage
        };
      });
      
      setSchedules(transformedSchedules);
    } catch (error) {
      console.error('Error loading schedules:', error);
      setToast({ show: true, message: 'Failed to load schedules', variant: 'error' });
    } finally {
      setLoadingSchedules(false);
    }
  };

  // Load routes from backend API
  const loadRoutes = async () => {
    try {
      const response = await api.routes.getAll();
      let fetchedRoutes = [];
      
      if (Array.isArray(response)) {
        fetchedRoutes = response;
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        fetchedRoutes = response.data.data;
      } else if (response.data && Array.isArray(response.data)) {
        fetchedRoutes = response.data;
      }
      
      // Transform backend data
      const transformedRoutes = fetchedRoutes.map(route => ({
        id: route.route_id || route.id,
        route_id: route.route_id,
        name: route.name,
        waypoints: route.waypoints || [],
        distance: route.distance,
        status: route.status
      }));
      
      setRoutes(transformedRoutes);
    } catch (error) {
      console.error('Error loading routes:', error);
      setRoutes([]);
    }
  };

  // Load schedules and routes on component mount
  useEffect(() => {
    loadSchedules();
    loadRoutes();
  }, []);
  const [viewingSchedule, setViewingSchedule] = useState(null);
  const [showScheduleDetailsModal, setShowScheduleDetailsModal] = useState(false);
  const [showBulkCreateModal, setShowBulkCreateModal] = useState(false);
  const [isBulkCreating, setIsBulkCreating] = useState(false);
  const [bulkCreateData, setBulkCreateData] = useState({
    scheduleType: 'specific', // 'specific', 'week', 'month'
    routeMode: 'same', // 'same' or 'different'
    routeId: '',
    dayRoutes: {
      Monday: '',
      Tuesday: '',
      Wednesday: '',
      Thursday: '',
      Friday: ''
    },
    startDate: '',
    endDate: '',
    specificDates: [],
    daysOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    startTime: '06:00'
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [editData, setEditData] = useState({
    routeId: '',
    date: '',
    startTime: '06:00'
  });

  // Get current week with all days (Mon-Sat)
  const getCurrentWeekDays = () => {
    // Use March 6, 2026 as the reference date (Friday of the current week)
    const now = new Date('2026-03-06');
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Get Monday of current week
    const monday = new Date(now);
    monday.setDate(now.getDate() - currentDay + (currentDay === 0 ? -6 : 1));
    monday.setHours(0, 0, 0, 0);
    
    // Apply week offset (0 = current week, 1 = next week, -1 = previous week)
    monday.setDate(monday.getDate() + (weekOffset * 7));
    
    const weekDays = [];
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // console.log(` Monday of week:`, monday.toISOString().split('T')[0], 'weekOffset:', weekOffset);
    
    for (let i = 0; i < 6; i++) {
      // Create a NEW date object for each day to avoid mutation
      const date = new Date(monday.getTime());
      date.setDate(date.getDate() + i);
      
      // Extract date string safely without timezone conversion
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;
      
      // Format date as "Mar 2, 2026"
      const dayOfMonth = date.getDate();
      const monthName = monthNames[date.getMonth()];
      const formattedDate = `${monthName} ${dayOfMonth}, ${year}`;
      
      // Find schedule for this day (match by DATE only, ignore day name from DB)
      const schedule = schedules.find(s => s.date === dateString);
      
      // console.log(`🔍 Day ${dayNames[i]} (${dateString}): ${schedule ? 'Found: ' + schedule.scheduleId : 'Not found'} Looking in:`, schedules.map(s => s.date));
      
      weekDays.push({
        day: dayNames[i],
        date: dateString,
        formattedDate: formattedDate,
        schedule: schedule || null
      });
    }
    
    return weekDays;
  };

  const currentWeekDays = useMemo(() => getCurrentWeekDays(), [schedules, weekOffset]);

  // console.log(currentWeekDays);
  
  
  // Get current schedule for selected day FROM CURRENT WEEK ONLY (match by date)
  const currentSchedule = useMemo(() => {
    const selectedDayInfo = currentWeekDays.find(d => d.day === selectedDay);
    if (!selectedDayInfo) return null;
    
    // Find schedule that matches the DATE of the selected day in current week
    const matchedSchedule = schedules.find(s => s.date === selectedDayInfo.date);
    
    return matchedSchedule || null;
  }, [schedules, selectedDay, currentWeekDays]);

  // console.log(currentSchedule);
  

  const dayOptions = [
    { value: 'Monday', label: 'Monday' },
    { value: 'Tuesday', label: 'Tuesday' },
    { value: 'Wednesday', label: 'Wednesday' },
    { value: 'Thursday', label: 'Thursday' },
    { value: 'Friday', label: 'Friday' },
  ];

  // Get schedule status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'primary';
      case 'completed': return 'success';
      case 'cancelled': return 'danger';
      default: return 'secondary';
    }
  };

  // Get location status label
  const getStatusLabel = (status) => {
    switch (status) {
      case 'start': return 'Start';
      case 'finish': return 'Finish';
      case 'ongoing': return 'Ongoing';
      default: return status;
    }
  };
  
  // Get location status circle color (for the route visualization)
  const getLocationStatusColor = (status) => {
    switch (status) {
      case 'start':
        return 'bg-purple-500 border-purple-600';
      case 'finish':
        return 'bg-red-500 border-red-600';
      case 'ongoing':
        return 'bg-yellow-400 border-yellow-500';
      default:
        return 'bg-gray-400 border-gray-500';
    }
  };

  const handleViewRoute = (location) => {
    setSelectedRoute(location);
    setShowRouteModal(true);
  };
  
  // Handle cancel schedule
  const handleOpenCancelModal = (schedule) => {
    setCancellingSchedule(schedule);
    setShowCancelModal(true);
  };
  
  const handleCancelSchedule = async (e) => {
    e.preventDefault();
    
    try {
      const response = await api.schedules.updateStatus(cancellingSchedule.id, {
        status: 'cancelled',
        cancel_reason: cancelReason
      });

      if (response.success) {
        setToast({ show: true, message: 'Schedule cancelled successfully', variant: 'success' });
        loadSchedules(); // Refresh schedules
      }
    } catch (error) {
      console.error('Error cancelling schedule:', error);
      setToast({ show: true, message: 'Failed to cancel schedule', variant: 'error' });
    } finally {
      setShowCancelModal(false);
      setCancellingSchedule(null);
      setCancelReason('');
    }
  };
  
  // Reactivate schedule
  const handleReactivateSchedule = async (schedule) => {
    try {
      const response = await api.schedules.updateStatus(schedule.id, {
        status: 'active'
      });

      if (response.success) {
        setToast({ show: true, message: 'Schedule reactivated successfully', variant: 'success' });
        loadSchedules(); // Refresh schedules
      }
    } catch (error) {
      console.error('Error reactivating schedule:', error);
      setToast({ show: true, message: 'Failed to reactivate schedule', variant: 'error' });
    }
  };
  
  // Mark schedule as completed
  const handleMarkAsCompleted = async (schedule) => {
    try {
      const response = await api.schedules.updateStatus(schedule.id, {
        status: 'completed'
      });

      if (response.success) {
        setToast({ show: true, message: 'Schedule marked as completed', variant: 'success' });
        loadSchedules(); // Refresh schedules
      }
    } catch (error) {
      console.error('Error marking schedule as completed:', error);
      setToast({ show: true, message: 'Failed to mark schedule as completed', variant: 'error' });
    }
  };

  // Open status update modal
  const handleOpenStatusModal = (schedule) => {
    setUpdatingSchedule(schedule);
    setNewStatus(schedule.status);
    setStatusCancelReason(schedule.cancelReason || ''); // Pre-populate if exists
    setStatusNotes(schedule.notes || ''); // Pre-populate notes if exists
    setShowStatusModal(true);
  };

  // Update schedule status
  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    
    try {
      const payload = { status: newStatus };
      
      // If changing to cancelled, require cancel reason
      if (newStatus === 'cancelled' && !statusCancelReason.trim()) {
        setToast({ show: true, message: 'Please provide cancel reason', variant: 'error' });
        return;
      }
      
      if (newStatus === 'cancelled') {
        payload.cancel_reason = statusCancelReason;
      }

      // Always include notes if provided
      if (statusNotes.trim()) {
        payload.notes = statusNotes;
      }

      const response = await api.schedules.updateStatus(updatingSchedule.id, payload);

      if (response.success) {
        setToast({ show: true, message: 'Status updated successfully', variant: 'success' });
        setShowStatusModal(false);
        setUpdatingSchedule(null);
        setNewStatus('');
        setStatusCancelReason('');
        setStatusNotes('');
        loadSchedules(); // Refresh schedules
      }
    } catch (error) {
      console.error('Error updating status:', error);
      setToast({ show: true, message: 'Failed to update status', variant: 'error' });
    }
  };

  // Helper function to create route locations from waypoints
  const createRouteLocations = (route, startTime) => {
    const startHour = parseInt(startTime.split(':')[0]);
    const startMinute = parseInt(startTime.split(':')[1]);
    
    return route.waypoints.map((wp, idx) => {
      // Add 30 minutes for each stop
      const totalMinutes = startHour * 60 + startMinute + (idx * 30);
      const hour = Math.floor(totalMinutes / 60) % 24;
      const minute = totalMinutes % 60;
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      const time = `${String(hour12).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${ampm}`;
      
      return {
        location: wp.name,
        time: time,
        status: wp.type
      };
    });
  };

  // Helper: Map database route ID to route_id string for static data
  const getRouteIdForSelect = (dbRouteId) => {
    // Map: 1 -> "ROUTE-001", 2 -> "ROUTE-002", 3 -> "ROUTE-003"
    if (!dbRouteId) return '';
    return `ROUTE-${String(dbRouteId).padStart(3, '0')}`;
  };

  const getDbRouteId = (routeIdString) => {
    // Map: "ROUTE-001" -> 1, "ROUTE-002" -> 2, etc.
    if (!routeIdString || routeIdString === '') return '';
    const match = routeIdString.match(/ROUTE-(\d+)/);
    return match ? parseInt(match[1], 10) : '';
  };

  // Handle edit schedule
  const handleEditSchedule = (schedule) => {
    setEditingSchedule(schedule);
    setEditData({
      routeId: getRouteIdForSelect(schedule.routeId),  // Convert DB ID (1) to "ROUTE-001"
      date: schedule.date || '',
      startTime: schedule.startTime ? schedule.startTime.substring(0, 5) : '06:00'  // Extract HH:MM from HH:MM:SS
    });
    setShowEditModal(true);
  };

  const handleUpdateSchedule = async (e) => {
    e.preventDefault();
    
    // Validate date and time before updating
    if (editData.date && editData.startTime && !validateDateTime(editData.date, editData.startTime)) {
      setToast({ 
        show: true, 
        message: 'Cannot update schedule to past date/time. Please select a future date and time.', 
        variant: 'error' 
      });
      return;
    }
    
    try {
      const updateData = {
        date: editData.date,
        start_time: editData.startTime + ':00'
      };

      if (editData.routeId) {
        updateData.route_id = getDbRouteId(editData.routeId);  // Convert "ROUTE-001" back to 1
      }

      const response = await api.schedules.update(editingSchedule.id, updateData);

      if (response.success) {
        setToast({ show: true, message: 'Schedule updated successfully', variant: 'success' });
        loadSchedules(); // Refresh schedules
        setShowEditModal(false);
        setEditingSchedule(null);
        setEditData({ routeId: '', date: '', startTime: '06:00' });
      }
    } catch (error) {
      console.error('Error updating schedule:', error);
      setToast({ show: true, message: 'Failed to update schedule', variant: 'error' });
    }
  };

  // Validate date and time (check if in the past)
  const validateDateTime = (dateStr, timeStr) => {
    const now = new Date();
    const [hours, minutes] = timeStr.split(':');
    const selectedDateTime = new Date(dateStr);
    selectedDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    return selectedDateTime > now;
  };

  // Handle bulk create schedules
  const handleBulkCreate = async (e) => {
    e.preventDefault();
    
    // Validate dates before submission
    let hasInvalidDates = false;
    
    if (bulkCreateData.scheduleType === 'specific') {
      // Check all specific dates
      hasInvalidDates = bulkCreateData.specificDates.some(date => 
        !validateDateTime(date, bulkCreateData.startTime)
      );
    } else if (bulkCreateData.scheduleType === 'week' || bulkCreateData.scheduleType === 'month') {
      // Check start date
      if (bulkCreateData.startDate && !validateDateTime(bulkCreateData.startDate, bulkCreateData.startTime)) {
        hasInvalidDates = true;
      }
    }
    
    if (hasInvalidDates) {
      setToast({ 
        show: true, 
        message: 'Cannot create schedules for past dates/times. Please select future dates and times.', 
        variant: 'error' 
      });
      return;
    }
    
    try {
      setIsBulkCreating(true);
      const schedulesToCreate = [];
      
      // Helper function to get route stops with proper status mapping
      const getRouteStops = (routeId) => {
        const selectedRoute = routes.find(r => r.id === routeId);
        if (!selectedRoute) return [];
        
        const locations = createRouteLocations(selectedRoute, bulkCreateData.startTime);
        
        // Map waypoint types to valid stop status values
        return locations.map((loc, idx) => ({
          location: loc.location,
          time: loc.time,
          status: loc.status === 'start' ? 'start' 
                : loc.status === 'end' ? 'finish' 
                : 'ongoing'  // 'pickup' becomes 'ongoing'
        }));
      };
    
    if (bulkCreateData.scheduleType === 'specific') {
      // Create schedules for specific dates
      bulkCreateData.specificDates.forEach(dateStr => {
        const date = new Date(dateStr);
        const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
        
        // Determine which route to use
        const routeId = bulkCreateData.routeMode === 'same' 
          ? bulkCreateData.routeId 
          : bulkCreateData.dayRoutes[dayOfWeek];
        
        if (!routeId) return;
        
        const routeLocations = getRouteStops(routeId);
        
        schedulesToCreate.push({
          route_id: getDbRouteId(routeId),  // Convert "ROUTE-001" to 1
          day: dayOfWeek,
          date: dateStr,
          start_time: bulkCreateData.startTime + ':00',
          end_time: '14:00:00',
          status: 'pending',
          stops: routeLocations
        });
      });
    } else if (bulkCreateData.scheduleType === 'week') {
      // Create schedules for whole week
      const startDate = new Date(bulkCreateData.startDate);
      
      bulkCreateData.daysOfWeek.forEach(dayName => {
        // Determine which route to use
        const routeId = bulkCreateData.routeMode === 'same' 
          ? bulkCreateData.routeId 
          : bulkCreateData.dayRoutes[dayName];
        
        if (!routeId) return;
        
        const routeLocations = getRouteStops(routeId);
        
        // Find the next occurrence of this day
        const dayIndex = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(dayName);
        const currentDay = startDate.getDay();
        let daysToAdd = dayIndex - currentDay;
        if (daysToAdd < 0) daysToAdd += 7;
        
        const scheduleDate = new Date(startDate);
        scheduleDate.setDate(startDate.getDate() + daysToAdd);
        
        schedulesToCreate.push({
          route_id: getDbRouteId(routeId),  // Convert "ROUTE-001" to 1
          day: dayName,
          date: scheduleDate.toISOString().split('T')[0],
          start_time: bulkCreateData.startTime + ':00',
          end_time: '14:00:00',
          status: 'pending',
          stops: routeLocations
        });
      });
    } else if (bulkCreateData.scheduleType === 'month') {
      // Create schedules for whole month
      const startDate = new Date(bulkCreateData.startDate);
      const endDate = new Date(bulkCreateData.endDate);
      
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const dayOfWeek = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
        
        // Only create for selected days of week
        if (bulkCreateData.daysOfWeek.includes(dayOfWeek)) {
          // Determine which route to use
          const routeId = bulkCreateData.routeMode === 'same' 
            ? bulkCreateData.routeId 
            : bulkCreateData.dayRoutes[dayOfWeek];
          
          if (routeId) {
            const routeLocations = getRouteStops(routeId);
            
            schedulesToCreate.push({
              route_id: getDbRouteId(routeId),  // Convert "ROUTE-001" to 1
              day: dayOfWeek,
              date: currentDate.toISOString().split('T')[0],
              start_time: bulkCreateData.startTime + ':00',
              end_time: '14:00:00',
              status: 'pending',
              stops: routeLocations
            });
          }
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }
    
    // Create schedules via API - with duplicate detection
    let createdCount = 0;
    let skippedCount = 0;
    let failedCount = 0;
    const skippedDates = [];
    
    for (const scheduleData of schedulesToCreate) {
      try {
        // Check if schedule already exists for this date
        const existingSchedule = schedules.find(s => 
          s.date === scheduleData.date && 
          s.routeId === scheduleData.route_id
        );
        
        if (existingSchedule) {
          skippedCount++;
          skippedDates.push(scheduleData.date);
          console.log(`Skipping duplicate schedule for ${scheduleData.date}`);
          continue; // Skip this schedule
        }
        
        const response = await api.schedules.create(scheduleData);
        if (response.success) {
          createdCount++;
        } else if (response.duplicate) {
          // Backend detected duplicate
          skippedCount++;
          skippedDates.push(scheduleData.date);
        } else {
          failedCount++;
        }
      } catch (error) {
        console.error('Error creating schedule:', error);
        // Check if error is due to duplicate (409 status)
        if (error.response && error.response.status === 409) {
          skippedCount++;
          skippedDates.push(scheduleData.date);
        } else {
          failedCount++;
        }
      }
    }
    
    // Reload all schedules
    await loadSchedules();
    
    // Show appropriate message
    let message = '';
    if (createdCount > 0 && skippedCount > 0) {
      message = `${createdCount} schedule(s) created successfully. ${skippedCount} duplicate(s) skipped.`;
    } else if (createdCount > 0) {
      message = `${createdCount} schedule(s) created successfully`;
    } else if (skippedCount > 0) {
      message = `All ${skippedCount} schedule(s) already exist. No new schedules created.`;
    } else {
      message = 'Failed to create schedules';
    }
    
    const variant = createdCount > 0 ? 'success' : (skippedCount > 0 ? 'warning' : 'error');
    setToast({ show: true, message, variant });
    
    } catch (error) {
      console.error('Error in bulk create:', error);
      setToast({ show: true, message: 'Failed to create schedules', variant: 'error' });
    } finally {
      setIsBulkCreating(false);
      setShowBulkCreateModal(false);
    }
    setBulkCreateData({
      scheduleType: 'specific',
      routeMode: 'same',
      routeId: '',
      dayRoutes: {
        Monday: '',
        Tuesday: '',
        Wednesday: '',
        Thursday: '',
        Friday: ''
      },
      startDate: '',
      endDate: '',
      specificDates: [],
      daysOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      startTime: '06:00'
    });
  };

  // Loading state
  if (loadingSchedules) {
    return <Loading message="Loading schedules..." />;
  }

  // Permission check
  if (!hasPermission(currentUser, 'view_schedules_module')) {
    return <AccessDenied message="You don't have permission to view Schedules." />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Collection Schedules</h1>
          <p className="text-gray-600 mt-1">View and manage waste collection schedules and routes</p>
        </div>
        <div className="flex items-center space-x-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                viewMode === 'list' 
                  ? 'bg-white text-gray-900 shadow' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              List
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                viewMode === 'calendar' 
                  ? 'bg-white text-gray-900 shadow' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Calendar
            </button>
          </div>
          
          <Button onClick={() => setShowBulkCreateModal(true)} variant="primary">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Bulk Create
          </Button>
          
          {viewMode === 'list' && (
            <Select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              options={dayOptions}
              className="w-48"
            />
          )}
         
        </div>
      </div>
      {/* <div className="w-full max-w-screen-2xl mx-auto px-6"> */}
        
        
        
      {/* Calendar or List View */}
      {viewMode === 'calendar' ? (
        <Card>
          <div className="p-6">
            {/* Calendar Header with Month Navigation */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const newMonth = new Date(currentMonth);
                    newMonth.setMonth(newMonth.getMonth() - 1);
                    setCurrentMonth(newMonth);
                  }}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => setCurrentMonth(new Date())}
                  className="px-3 py-1.5 text-sm font-medium hover:bg-gray-100 rounded"
                >
                  Today
                </button>
                <button
                  onClick={() => {
                    const newMonth = new Date(currentMonth);
                    newMonth.setMonth(newMonth.getMonth() + 1);
                    setCurrentMonth(newMonth);
                  }}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Day Headers */}
              <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
                {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                  <div key={day} className="p-3 text-center text-sm font-semibold text-gray-700 border-r border-gray-200 last:border-r-0">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Calendar Days Grid */}
              <div className="grid grid-cols-7">
                {(() => {
                  const year = currentMonth.getFullYear();
                  const month = currentMonth.getMonth();
                  const firstDay = new Date(year, month, 1).getDay();
                  const daysInMonth = new Date(year, month + 1, 0).getDate();
                  const days = [];
                  
                  // Empty cells for days before month starts
                  for (let i = 0; i < firstDay; i++) {
                    days.push(
                      <div key={`empty-${i}`} className="min-h-32 p-2 bg-gray-50 border-r border-b border-gray-200"></div>
                    );
                  }
                  
                  // Days of the month
                  for (let day = 1; day <= daysInMonth; day++) {
                    const currentDate = new Date(year, month, day);
                    
                    // Extract date string WITHOUT timezone conversion
                    const dateYear = currentDate.getFullYear();
                    const dateMonth = String(currentDate.getMonth() + 1).padStart(2, '0');
                    const dateDay = String(currentDate.getDate()).padStart(2, '0');
                    const dateString = `${dateYear}-${dateMonth}-${dateDay}`;
                    
                    const daySchedules = schedules.filter(s => s.date === dateString);
                    const isToday = new Date().toDateString() === currentDate.toDateString();
                    
                    days.push(
                      <div
                        key={day}
                        className={`min-h-32 p-2 border-r border-b border-gray-200 ${
                          isToday ? 'bg-blue-50' : 'bg-white'
                        } hover:bg-gray-50`}
                      >
                        <div className={`text-sm font-medium mb-2 ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                          {day}
                        </div>
                        <div className="space-y-1">
                          {daySchedules.map(schedule => (
                            <div
                              key={schedule.id}
                              className={`text-xs p-1.5 rounded cursor-pointer truncate relative group ${
                                schedule.status === 'active' ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' :
                                schedule.status === 'completed' ? 'bg-green-100 text-green-800 hover:bg-green-200' :
                                schedule.status === 'cancelled' ? 'bg-red-100 text-red-800 hover:bg-red-200' :
                                'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                              }`}
                            >
                              <div 
                                onClick={() => {
                                  setViewingSchedule(schedule);
                                  setShowScheduleDetailsModal(true);
                                }}
                                className="flex-1"
                              >
                                <div className="font-medium">{schedule.day}</div>
                                <div className="text-[10px]">{schedule.date}</div>
                                {schedule.status === 'cancelled' && (
                                  <div className="text-[10px]">Cancelled</div>
                                )}
                              </div>
                              <div className="absolute top-0.5 right-0.5 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenStatusModal(schedule);
                                  }}
                                  className="p-0.5 bg-white rounded hover:bg-blue-50"
                                  title="Update status"
                                >
                                  <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditSchedule(schedule);
                                  }}
                                  className="p-0.5 bg-white rounded hover:bg-gray-50"
                                  title="Edit schedule"
                                >
                                  <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  
                  return days;
                })()}
              </div>
            </div>
            
            {/* Legend */}
            <div className="mt-6 flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-100 rounded"></div>
                <span>Active</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-100 rounded"></div>
                <span>Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-100 rounded"></div>
                <span>Cancelled</span>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <>
      {/* Weekly Overview */}
      <Card>
        <div className="p-4">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Weekly Overview</h3>
            <p className="text-xs text-gray-600">Collection schedule for the entire week</p>
          </div>
          <div className="overflow-x-auto pb-2" >
            <div className="flex gap-3">
          {currentWeekDays.map((dayInfo) => (
            <div
              key={dayInfo.day}
              className={`
               px-4 py-3 border-2 rounded-lg transition-all
                flex-shrink-0
                h-[140px]
                w-full sm:w-[215px]

                ${selectedDay === dayInfo.day
                  ? 'border-primary-500 bg-primary-50'
                  : dayInfo.schedule 
                    ? 'border-gray-200 hover:border-primary-300 bg-white'
                    : 'border-gray-200 bg-gray-50'
                }
              `}
            >
              <div className="flex items-center justify-between mb-1">
                <div>
                  <h3 
                    className={`text-base font-bold cursor-pointer ${selectedDay === dayInfo.day ? 'text-primary-700' : 'text-gray-900'}`}
                    onClick={() => setSelectedDay(dayInfo.day)}
                  >
                    {dayInfo.day}
                  </h3>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {dayInfo.formattedDate}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {dayInfo.schedule ? (
                    <>
                      {/* Status Icon */}
                      {dayInfo.schedule.status === 'active' && (
                        <div className="p-1 bg-blue-100 rounded" title="Active">
                          <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                      {dayInfo.schedule.status === 'completed' && (
                        <div className="p-1 bg-green-100 rounded" title="Completed">
                          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                      {dayInfo.schedule.status === 'cancelled' && (
                        <div className="p-1 bg-red-100 rounded" title="Cancelled">
                          <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                      {dayInfo.schedule.status === 'pending' && (
                        <div className="p-1 bg-yellow-100 rounded" title="Pending">
                          <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                      
                      {/* Action Buttons */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenStatusModal(dayInfo.schedule);
                        }}
                        className="p-1 hover:bg-blue-50 rounded transition-colors"
                        title="Update status"
                      >
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditSchedule(dayInfo.schedule);
                        }}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                        title="Edit schedule"
                      >
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
              
              {dayInfo.schedule ? (
                <>
                  <div className="mt-2">
                    <div className="text-sm font-medium text-gray-900 mb-1">
                      {dayInfo.schedule.routeName || 'Collection Route'}
                    </div>
                    {dayInfo.schedule.status === 'cancelled' && dayInfo.schedule.cancelReason ? (
                      <div className="p-1 bg-red-50 border border-red-200 rounded text-xs text-red-700 truncate">
                        ⚠️ {dayInfo.schedule.cancelReason}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-600">
                        {(dayInfo.schedule.stops?.length || 0)} stops scheduled
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="mt-2 text-sm text-gray-500 italic">
                  No collection scheduled
                </div>
              )}
            </div>
          ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Current Day Info */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{selectedDay} Route</h2>
            <p className="text-sm text-gray-600 mt-1">Collection route for {selectedDay}</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-purple-100 rounded-lg">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span className="text-sm font-medium text-purple-900">Start</span>
            </div>
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-yellow-100 rounded-lg">
              <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
              <span className="text-sm font-medium text-yellow-900">Ongoing</span>
            </div>
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-red-100 rounded-lg">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm font-medium text-red-900">Finish</span>
            </div>
          </div>
        </div>

        {/* Route Visualization */}
        {currentSchedule && (
          <div className="relative">
            {/* Connection Lines */}
            <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gray-200"></div>

            {/* Route Locations */}
            <div className="space-y-4">
              {currentSchedule.stops && Array.isArray(currentSchedule.stops) && currentSchedule.stops.map((location, index) => (
                <div
                  key={index}
                  className="relative flex items-center space-x-4 group"
                >
                  {/* Status Indicator */}
                  <div className={`
                    relative z-10 w-12 h-12 rounded-full border-4 flex items-center justify-center
                    ${getLocationStatusColor(location.status)}
                    shadow-md transition-transform group-hover:scale-110
                  `}>
                    <span className="text-white font-bold text-sm">{index + 1}</span>
                  </div>

                  {/* Location Card */}
                  <div className="flex-1 bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-primary-500 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-base font-semibold text-gray-900">{location.location}</h3>
                          <Badge variant={
                            location.status === 'start' ? 'primary' :
                            location.status === 'finish' ? 'danger' : 'warning'
                          } size="xs">
                            {getStatusLabel(location.status)}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{location.time}</span>
                          </div>
                          {index > 0 && (
                            <div className="flex items-center space-x-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                              </svg>
                              <span>Stop {index}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => handleViewRoute(location)}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!currentSchedule && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-600">No schedule available for {selectedDay}</p>
          </div>
        )}
      </Card>
        </>
      )}

      {/* </div> */}


      {/* Location Details Modal */}
      <ViewModal
        isOpen={showRouteModal}
        onClose={() => setShowRouteModal(false)}
        title="Location Details"
        size="md"
      >
        {selectedRoute && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Location Name</h3>
              <p className="text-lg font-semibold text-gray-900">{selectedRoute.location}</p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Scheduled Time</h3>
                <p className="text-base text-gray-900">{selectedRoute.time}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
                <Badge variant={
                  selectedRoute.status === 'start' ? 'primary' :
                  selectedRoute.status === 'finish' ? 'danger' : 'warning'
                }>
                  {getStatusLabel(selectedRoute.status)}
                </Badge>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Day</h3>
              <p className="text-base text-gray-900">{selectedDay}</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-blue-900">Collection Information</p>
                  <p className="text-xs text-blue-700 mt-1">
                    Collection crew should arrive at this location at the scheduled time. 
                    Please ensure proper waste segregation before collection.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </ViewModal>


      {/* Cancel Schedule Modal */}
      {cancellingSchedule && (
        <FormModal
          isOpen={showCancelModal}
          onClose={() => {
            setShowCancelModal(false);
            setCancellingSchedule(null);
            setCancelReason('');
          }}
          onSubmit={handleCancelSchedule}
          title="Cancel Schedule"
          submitText="Cancel Schedule"
          variant="danger"
        >
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">
                <strong>Warning:</strong> You are about to cancel the collection schedule for <strong>{cancellingSchedule.day}, {cancellingSchedule.date}</strong>.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Cancellation *
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g., Heavy rain and flooding, Vehicle breakdown, Holiday"
                required
                rows="3"
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                This reason will be shown to users and can be used in announcements
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                💡 <strong>Tip:</strong> After cancelling, create an announcement to notify residents about the cancellation and new schedule.
              </p>
            </div>
          </div>
        </FormModal>
      )}

      {/* Schedule Details Modal */}
      {viewingSchedule && (
        <ViewModal
          isOpen={showScheduleDetailsModal}
          onClose={() => {
            setShowScheduleDetailsModal(false);
            setViewingSchedule(null);
          }}
          title="Schedule Details"
          size="lg"
        >
          <div className="space-y-6">
            {/* Schedule Header */}
            <div className="flex items-center justify-between pb-4 border-b">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{viewingSchedule.day}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {viewingSchedule.date ? new Date(viewingSchedule.date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  }) : 'No date set'}
                </p>
              </div>
              <Badge variant={getStatusColor(viewingSchedule.status)} size="lg">
                {viewingSchedule.status}
              </Badge>
            </div>

            {/* Cancel Reason if cancelled */}
            {viewingSchedule.status === 'cancelled' && viewingSchedule.cancelReason && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="text-sm font-semibold text-red-900 mb-1">Cancellation Reason</h4>
                <p className="text-sm text-red-700">{viewingSchedule.cancelReason}</p>
              </div>
            )}

            {/* Schedule Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Total Stops</h4>
                <p className="text-lg font-semibold text-gray-900">{(viewingSchedule.stops?.length || 0)}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Start Time</h4>
                <p className="text-lg font-semibold text-gray-900">{viewingSchedule.stops?.[0]?.time || 'N/A'}</p>
              </div>
            </div>

            {/* Route Details */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Collection Route</h4>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {viewingSchedule.stops && Array.isArray(viewingSchedule.stops) && viewingSchedule.stops.map((location, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold
                      ${location.status === 'start' ? 'bg-purple-500' :
                        location.status === 'finish' ? 'bg-red-500' : 'bg-yellow-400'}
                    `}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{location.location}</p>
                        <Badge
                          variant={
                            location.status === 'start' ? 'primary' :
                            location.status === 'finish' ? 'danger' : 'warning'
                          }
                          size="xs"
                        >
                          {getStatusLabel(location.status)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{location.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-4 border-t">
              {viewingSchedule.status === 'active' && (
                <>
                  <Button
                    onClick={() => {
                      handleMarkAsCompleted(viewingSchedule);
                      setShowScheduleDetailsModal(false);
                    }}
                    variant="success"
                  >
                    ✓ Mark as Completed
                  </Button>
                  <Button
                    onClick={() => {
                      setShowScheduleDetailsModal(false);
                      handleOpenCancelModal(viewingSchedule);
                    }}
                    variant="danger"
                  >
                    Cancel Schedule
                  </Button>
                </>
              )}
              {viewingSchedule.status === 'cancelled' && (
                <Button
                  onClick={() => {
                    handleReactivateSchedule(viewingSchedule);
                    setShowScheduleDetailsModal(false);
                  }}
                  variant="success"
                >
                  Reactivate Schedule
                </Button>
              )}
              {viewingSchedule.status === 'completed' && (
                <Button
                  onClick={() => {
                    handleReactivateSchedule(viewingSchedule);
                    setShowScheduleDetailsModal(false);
                  }}
                  variant="primary"
                >
                  Reactivate Schedule
                </Button>
              )}
              <Button
                onClick={() => setShowScheduleDetailsModal(false)}
                variant="outline"
              >
                Close
              </Button>
            </div>
          </div>
        </ViewModal>
      )}

      {/* Edit Schedule Modal */}
      <FormModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingSchedule(null);
          setEditData({ routeId: '', date: '', startTime: '06:00' });
        }}
        onSubmit={handleUpdateSchedule}
        title={`Edit Schedule - ${editingSchedule?.day}`}
        submitText="Update Schedule"
        size="md"
      >
        {editingSchedule && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Editing:</strong> {editingSchedule.day}, {editingSchedule.date ? new Date(editingSchedule.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'No date set'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Route *
              </label>
              <select
                value={editData.routeId}
                onChange={(e) => setEditData({ ...editData, routeId: e.target.value })}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              >
                <option value="">Choose a route...</option>
                {routesData.map((route) => (
                  <option key={route.id} value={route.id}>
                    {route.name} ({route.waypoints.length} waypoints - {route.distance})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Schedule Date *
              </label>
              <Input
                type="date"
                value={editData.date}
                onChange={(e) => setEditData({ ...editData, date: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Time *
              </label>
              <Input
                type="time"
                value={editData.startTime}
                onChange={(e) => setEditData({ ...editData, startTime: e.target.value })}
                required
              />
              <p className="text-xs text-gray-500 mt-1">Collection will start at this time</p>
            </div>

            {editData.routeId && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                <p className="text-sm text-gray-600">
                  {routes.find(r => r.id === editData.routeId)?.waypoints?.length || 0} stops will be scheduled starting at <strong>{editData.startTime}</strong>
                </p>
              </div>
            )}
          </div>
        )}
      </FormModal>

      {/* Status Update Modal */}
      <FormModal
        isOpen={showStatusModal}
        onClose={() => {
          setShowStatusModal(false);
          setUpdatingSchedule(null);
          setNewStatus('');
          setStatusCancelReason('');
          setStatusNotes('');
        }}
        onSubmit={handleUpdateStatus}
        title="Update Schedule Status"
        submitText="Update Status"
        size="lg"
      >
        {updatingSchedule && (
          <div className="space-y-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-sm font-medium text-gray-700">
                Schedule: {updatingSchedule.scheduleId}
              </p>
              <p className="text-sm text-gray-600">
                {updatingSchedule.day}, {updatingSchedule.date}
              </p>
              <p className="text-sm text-gray-600">
                Current Status: <span className={`font-semibold ${
                  updatingSchedule.status === 'active' ? 'text-blue-600' :
                  updatingSchedule.status === 'completed' ? 'text-green-600' :
                  updatingSchedule.status === 'cancelled' ? 'text-red-600' :
                  'text-yellow-600'
                }`}>{updatingSchedule.status}</span>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Update Schedule Status *
              </label>
              <div className="space-y-3">
                <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="status"
                    value="pending"
                    checked={newStatus === 'pending'}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-4 h-4 text-yellow-600 focus:ring-yellow-500"
                  />
                  <span className="ml-3 flex items-center">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                    <span className="text-sm font-medium text-gray-900">Pending</span>
                    <span className="ml-2 text-xs text-gray-500">- Scheduled but not started</span>
                  </span>
                </label>

                <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="status"
                    value="active"
                    checked={newStatus === 'active'}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-3 flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                    <span className="text-sm font-medium text-gray-900">Active</span>
                    <span className="ml-2 text-xs text-gray-500">- Currently ongoing</span>
                  </span>
                </label>

                <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="status"
                    value="completed"
                    checked={newStatus === 'completed'}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-4 h-4 text-green-600 focus:ring-green-500"
                  />
                  <span className="ml-3 flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    <span className="text-sm font-medium text-gray-900">Completed</span>
                    <span className="ml-2 text-xs text-gray-500">- Successfully finished</span>
                  </span>
                </label>

                <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="status"
                    value="cancelled"
                    checked={newStatus === 'cancelled'}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-4 h-4 text-red-600 focus:ring-red-500"
                  />
                  <span className="ml-3 flex items-center">
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                    <span className="text-sm font-medium text-gray-900">Cancelled</span>
                    <span className="ml-2 text-xs text-gray-500">- Schedule was cancelled</span>
                  </span>
                </label>
              </div>
            </div>

            {newStatus === 'cancelled' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cancel Reason *
                </label>
                <textarea
                  value={statusCancelReason}
                  onChange={(e) => setStatusCancelReason(e.target.value)}
                  rows={3}
                  placeholder="Please provide a reason for cancellation..."
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                rows={3}
                placeholder="Add any additional notes or remarks..."
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                General notes/remarks for this schedule
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800">
                <strong>Note:</strong> Changing the status will affect the schedule's visibility and workflow.
              </p>
            </div>
          </div>
        )}
      </FormModal>

      {/* Bulk Create Modal */}
      <FormModal
        isOpen={showBulkCreateModal}
        onClose={() => {
          setShowBulkCreateModal(false);
          setBulkCreateData({
            scheduleType: 'specific',
            routeMode: 'same',
            routeId: '',
            dayRoutes: {
              Monday: '',
              Tuesday: '',
              Wednesday: '',
              Thursday: '',
              Friday: ''
            },
            startDate: '',
            endDate: '',
            specificDates: [],
            daysOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            startTime: '06:00'
          });
        }}
        onSubmit={handleBulkCreate}
        title="Bulk Create Schedules"
        submitText="Create Schedules"
        isLoading={isBulkCreating}
        size="lg"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Bulk Create:</strong> Create multiple schedules at once for specific dates, whole week, or whole month.
            </p>
          </div>

          {/* Schedule Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Schedule Type *
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setBulkCreateData({ ...bulkCreateData, scheduleType: 'specific' })}
                className={`p-3 border-2 rounded-lg text-sm font-medium transition-all ${
                  bulkCreateData.scheduleType === 'specific'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-1"></div>
                  <div>Specific Dates</div>
                  <div className="text-xs text-gray-500 mt-1">Select individual dates</div>
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => setBulkCreateData({ ...bulkCreateData, scheduleType: 'week' })}
                className={`p-3 border-2 rounded-lg text-sm font-medium transition-all ${
                  bulkCreateData.scheduleType === 'week'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-1"></div>
                  <div>Whole Week</div>
                  <div className="text-xs text-gray-500 mt-1">Set up weekly schedule</div>
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => setBulkCreateData({ ...bulkCreateData, scheduleType: 'month' })}
                className={`p-3 border-2 rounded-lg text-sm font-medium transition-all ${
                  bulkCreateData.scheduleType === 'month'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-1"></div>
                  <div>Whole Month</div>
                  <div className="text-xs text-gray-500 mt-1">Set up monthly schedule</div>
                </div>
              </button>
            </div>
          </div>

          {/* Route Mode Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Route Assignment *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setBulkCreateData({ ...bulkCreateData, routeMode: 'same' })}
                className={`p-3 border-2 rounded-lg text-sm font-medium transition-all ${
                  bulkCreateData.routeMode === 'same'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-1"></div>
                  <div>Same Route</div>
                  <div className="text-xs text-gray-500 mt-1">Use one route for all days</div>
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => setBulkCreateData({ ...bulkCreateData, routeMode: 'different' })}
                className={`p-3 border-2 rounded-lg text-sm font-medium transition-all ${
                  bulkCreateData.routeMode === 'different'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-1"></div>
                  <div>Different Routes</div>
                  <div className="text-xs text-gray-500 mt-1">Choose route per day</div>
                </div>
              </button>
            </div>
          </div>

          {/* Route Selection - Same Route Mode */}
          {bulkCreateData.routeMode === 'same' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Route *
              </label>
              <select
                value={bulkCreateData.routeId}
                onChange={(e) => setBulkCreateData({ ...bulkCreateData, routeId: e.target.value })}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              >
                <option value="">Choose a route...</option>
                {routes.map((route) => (
                  <option key={route.id} value={route.id}>
                    {route.name} ({route.waypoints?.length || 0} waypoints - {route.distance})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">This route will be used for all selected days</p>
            </div>
          )}

          {/* Route Selection - Different Routes Mode */}
          {bulkCreateData.routeMode === 'different' && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Select Route for Each Day *
              </label>
              {bulkCreateData.daysOfWeek.map((day) => (
                <div key={day}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {day}
                  </label>
                  <select
                    value={bulkCreateData.dayRoutes[day]}
                    onChange={(e) => setBulkCreateData({ 
                      ...bulkCreateData, 
                      dayRoutes: { ...bulkCreateData.dayRoutes, [day]: e.target.value }
                    })}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  >
                    <option value="">Choose route for {day}...</option>
                    {routes.map((route) => (
                      <option key={route.id} value={route.id}>
                        {route.name} ({route.waypoints?.length || 0} waypoints - {route.distance})
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}

          {/* Specific Dates Mode */}
          {bulkCreateData.scheduleType === 'specific' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Dates *
              </label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    type="date"
                    onChange={(e) => {
                      if (e.target.value && !bulkCreateData.specificDates.includes(e.target.value)) {
                        setBulkCreateData({
                          ...bulkCreateData,
                          specificDates: [...bulkCreateData.specificDates, e.target.value].sort()
                        });
                      }
                    }}
                    className="flex-1"
                  />
                </div>
                {bulkCreateData.specificDates.length > 0 && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 mb-2">Selected Dates ({bulkCreateData.specificDates.length}):</p>
                    <div className="flex flex-wrap gap-2">
                      {bulkCreateData.specificDates.map((date) => (
                        <div
                          key={date}
                          className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-gray-300 rounded-full text-sm"
                        >
                          <span>{new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setBulkCreateData({
                                ...bulkCreateData,
                                specificDates: bulkCreateData.specificDates.filter(d => d !== date)
                              });
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Week Mode */}
          {bulkCreateData.scheduleType === 'week' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Week Start Date *
              </label>
              <Input
                type="date"
                value={bulkCreateData.startDate}
                onChange={(e) => setBulkCreateData({ ...bulkCreateData, startDate: e.target.value })}
                required
              />
              <p className="text-xs text-gray-500 mt-1">Schedules will be created for selected days in this week</p>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Days of Week *
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => {
                        if (bulkCreateData.daysOfWeek.includes(day)) {
                          setBulkCreateData({
                            ...bulkCreateData,
                            daysOfWeek: bulkCreateData.daysOfWeek.filter(d => d !== day)
                          });
                        } else {
                          setBulkCreateData({
                            ...bulkCreateData,
                            daysOfWeek: [...bulkCreateData.daysOfWeek, day]
                          });
                        }
                      }}
                      className={`px-3 py-2 border-2 rounded-lg text-sm font-medium transition-all ${
                        bulkCreateData.daysOfWeek.includes(day)
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      {day.substring(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Month Mode */}
          {bulkCreateData.scheduleType === 'month' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date *
                  </label>
                  <Input
                    type="date"
                    value={bulkCreateData.startDate}
                    onChange={(e) => setBulkCreateData({ ...bulkCreateData, startDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date *
                  </label>
                  <Input
                    type="date"
                    value={bulkCreateData.endDate}
                    onChange={(e) => setBulkCreateData({ ...bulkCreateData, endDate: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Days of Week *
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => {
                        if (bulkCreateData.daysOfWeek.includes(day)) {
                          setBulkCreateData({
                            ...bulkCreateData,
                            daysOfWeek: bulkCreateData.daysOfWeek.filter(d => d !== day)
                          });
                        } else {
                          setBulkCreateData({
                            ...bulkCreateData,
                            daysOfWeek: [...bulkCreateData.daysOfWeek, day]
                          });
                        }
                      }}
                      className={`px-3 py-2 border-2 rounded-lg text-sm font-medium transition-all ${
                        bulkCreateData.daysOfWeek.includes(day)
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      {day.substring(0, 3)}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Schedules will be created for selected days between the date range
                </p>
              </div>
            </div>
          )}

          {/* Start Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Time *
            </label>
            <Input
              type="time"
              value={bulkCreateData.startTime}
              onChange={(e) => setBulkCreateData({ ...bulkCreateData, startTime: e.target.value })}
              required
            />
            <p className="text-xs text-gray-500 mt-1">Collection will start at this time for all schedules</p>
          </div>

          {/* Preview */}
          {((bulkCreateData.routeMode === 'same' && bulkCreateData.routeId) || 
            (bulkCreateData.routeMode === 'different' && Object.values(bulkCreateData.dayRoutes).some(r => r))) && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
              <div className="text-sm text-gray-600 space-y-1">
                <p>
                  {bulkCreateData.scheduleType === 'specific' && (
                    <>Creating <strong>{bulkCreateData.specificDates.length}</strong> schedule{bulkCreateData.specificDates.length !== 1 ? 's' : ''}</>
                  )}
                  {bulkCreateData.scheduleType === 'week' && (
                    <>Creating schedules for <strong>{bulkCreateData.daysOfWeek.length}</strong> day{bulkCreateData.daysOfWeek.length !== 1 ? 's' : ''} in the week</>
                  )}
                  {bulkCreateData.scheduleType === 'month' && bulkCreateData.startDate && bulkCreateData.endDate && (
                    <>Creating schedules from <strong>{new Date(bulkCreateData.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</strong> to <strong>{new Date(bulkCreateData.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</strong> for <strong>{bulkCreateData.daysOfWeek.length}</strong> day{bulkCreateData.daysOfWeek.length !== 1 ? 's' : ''} per week</>
                  )}
                </p>
                <p>
                  <strong>Route Mode:</strong> {bulkCreateData.routeMode === 'same' ? 'Same route for all days' : 'Different route per day'}
                </p>
              </div>
            </div>
          )}
        </div>
      </FormModal>

      {/* Toast Notifications */}
      <Toast
        show={toast.show}
        message={toast.message}
        variant={toast.variant}
        onClose={() => setToast({ ...toast, show: false })}
      />
    </div>
  );
};

export default SchedulesPage;

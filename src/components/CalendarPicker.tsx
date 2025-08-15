import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../utils/theme';

interface CalendarPickerProps {
  visible: boolean;
  onClose: () => void;
  onDateSelect: (date: Date) => void;
  selectedDate?: Date;
  minDate?: Date;
  maxDate?: Date;
  title?: string;
}

const CalendarPicker: React.FC<CalendarPickerProps> = ({
  visible,
  onClose,
  onDateSelect,
  selectedDate = new Date(),
  minDate,
  maxDate,
  title = 'Seleccionar Fecha'
}) => {
  const [currentDate, setCurrentDate] = useState(selectedDate);

  const months = [
    'ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN',
    'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'
  ];

  const daysOfWeek = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    // Ajustar para que Lunes sea 0
    const adjustedStartingDay = startingDay === 0 ? 6 : startingDay - 1;
    
    return { daysInMonth, startingDay: adjustedStartingDay };
  };

  const goToPreviousMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    if (!minDate || newDate >= minDate) {
      setCurrentDate(newDate);
    }
  };

  const goToNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    if (!maxDate || newDate <= maxDate) {
      setCurrentDate(newDate);
    }
  };

  const isDateSelectable = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    if (minDate && date < minDate) return false;
    if (maxDate && date > maxDate) return false;
    return true;
  };

  const isDateSelected = (day: number) => {
    return selectedDate.getDate() === day &&
           selectedDate.getMonth() === currentDate.getMonth() &&
           selectedDate.getFullYear() === currentDate.getFullYear();
  };

  const handleDateSelect = (day: number) => {
    if (!isDateSelectable(day)) return;
    
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    onDateSelect(newDate);
    onClose();
  };

  const renderCalendar = () => {
    const { daysInMonth, startingDay } = getDaysInMonth(currentDate);
    const days = [];
    
    // Agregar días vacíos al inicio
    for (let i = 0; i < startingDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.calendarDay} />);
    }
    
    // Agregar días del mes
    for (let day = 1; day <= daysInMonth; day++) {
      const selectable = isDateSelectable(day);
      const selected = isDateSelectable(day) && isDateSelected(day);
      
      days.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.calendarDay,
            selected && styles.selectedDay,
            !selectable && styles.disabledDay
          ]}
          onPress={() => handleDateSelect(day)}
          disabled={!selectable}
        >
          <Text style={[
            styles.dayText,
            selected && styles.selectedDayText,
            !selectable && styles.disabledDayText
          ]}>
            {day}
          </Text>
        </TouchableOpacity>
      );
    }
    
    return days;
  };

  const formatSelectedDate = () => {
    const day = selectedDate.getDate();
    const month = months[selectedDate.getMonth()];
    const year = selectedDate.getFullYear();
    return `${day} ${month.toLowerCase()} ${year}`;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.calendarContainer}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.title}>{title}</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Month Navigation */}
          <View style={styles.monthNavigation}>
            <TouchableOpacity 
              onPress={goToPreviousMonth}
              style={styles.navButton}
              disabled={minDate && currentDate.getMonth() === minDate.getMonth() && currentDate.getFullYear() === minDate.getFullYear()}
            >
              <Ionicons name="chevron-back" size={20} color="#fff" />
            </TouchableOpacity>
            
            <View style={styles.monthDisplay}>
              <Text style={styles.monthText}>
                {months[currentDate.getMonth()]} {currentDate.getFullYear()}
              </Text>
              <Ionicons name="chevron-down" size={12} color="#ccc" />
            </View>
            
            <TouchableOpacity 
              onPress={goToNextMonth}
              style={styles.navButton}
              disabled={maxDate && currentDate.getMonth() === maxDate.getMonth() && currentDate.getFullYear() === maxDate.getFullYear()}
            >
              <Ionicons name="chevron-forward" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Days of Week */}
          <View style={styles.daysOfWeek}>
            {daysOfWeek.map((day, index) => (
              <View key={index} style={styles.dayOfWeek}>
                <Text style={styles.dayOfWeekText}>{day}</Text>
              </View>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>
            {renderCalendar()}
          </View>

          {/* Selected Date Display */}
          <View style={styles.selectedDateContainer}>
            <Text style={styles.selectedDateText}>{formatSelectedDate()}</Text>
            <Ionicons name="calendar" size={16} color="#ccc" />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarContainer: {
    backgroundColor: '#181818',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 350,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  monthNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  navButton: {
    padding: 8,
  },
  monthDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  monthText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  daysOfWeek: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  dayOfWeek: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  dayOfWeekText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ccc',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 1,
  },
  dayText: {
    fontSize: 16,
    color: '#fff',
  },
  selectedDay: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
  },
  selectedDayText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  disabledDay: {
    opacity: 0.3,
  },
  disabledDayText: {
    color: '#666',
  },
  selectedDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#222',
    borderRadius: 8,
  },
  selectedDateText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
});

export default CalendarPicker;

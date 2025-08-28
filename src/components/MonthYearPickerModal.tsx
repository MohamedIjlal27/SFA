import React from 'react';
import { Modal, View, TouchableWithoutFeedback } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Button, IconButton, Text, useTheme, Divider } from 'react-native-paper';
import { createMonthYearPickerModalStyles } from '../utils/styles/MonthYearPickerModal.styles';

interface MonthYearPickerModalProps {
  visible: boolean;
  selectedMonth: string;
  selectedYear: string;
  monthOptions: string[];
  yearOptions: string[];
  monthLabels: string[];
  onMonthChange: (month: string) => void;
  onYearChange: (year: string) => void;
  onClose: () => void;
}

const MonthYearPickerModal: React.FC<MonthYearPickerModalProps> = ({
  visible,
  selectedMonth,
  selectedYear,
  monthOptions,
  yearOptions,
  monthLabels,
  onMonthChange,
  onYearChange,
  onClose,
}) => {
  const theme = useTheme();
  const styles = createMonthYearPickerModalStyles(theme);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
            <View style={styles.modalCard}>
              <View style={styles.headerRow}>
                <Text style={styles.modalTitle}>Select Month & Year</Text>
                <IconButton icon="close" onPress={onClose} size={24} style={styles.closeButton} />
              </View>
              <Divider style={styles.divider} />
              <View style={styles.pickerContainer}>
                <View style={styles.pickerColumn}>
                  <Text style={styles.pickerLabel}>Month</Text>
                  <View style={styles.pickerWrapper}>
                    <Picker
                      selectedValue={selectedMonth}
                      onValueChange={onMonthChange}
                      mode="dropdown"
                      style={styles.picker}
                    >
                      {monthOptions.map((monthValue, i) => (
                        <Picker.Item
                          key={monthValue}
                          label={monthLabels[i]}
                          value={monthValue}
                        />
                      ))}
                    </Picker>
                  </View>
                </View>
                <Divider style={styles.verticalDivider} />
                <View style={styles.pickerColumn}>
                  <Text style={styles.pickerLabel}>Year</Text>
                  <View style={styles.pickerWrapper}>
                    <Picker
                      selectedValue={selectedYear}
                      onValueChange={onYearChange}
                      mode="dropdown"
                      style={styles.picker}
                    >
                      {yearOptions.map((year) => (
                        <Picker.Item key={year} label={year} value={year} />
                      ))}
                    </Picker>
                  </View>
                </View>
              </View>
              <Button
                mode="contained"
                onPress={onClose}
                style={styles.doneButton}
                contentStyle={{ paddingVertical: 6 }}
                labelStyle={{ fontWeight: 'bold', fontSize: 16 }}
              >
                Done
              </Button>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default MonthYearPickerModal; 
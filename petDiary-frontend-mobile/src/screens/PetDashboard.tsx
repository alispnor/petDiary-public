import React, { useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { useAppStore } from '../store/useAppStore';
import { handleDocumentCapture } from '../utils/handleDocumentCapture';
import type { RootStackParamList } from '../navigation/AppNavigator';
import type { TimelineRecord } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'PetDashboard'>;

// Timeline simulada
const MOCK_TIMELINE: TimelineRecord[] = [
  {
    id: 'rec-1',
    petId: '1',
    type: 'vaccine',
    title: 'V10 - Dose 3',
    description: 'Vacina polivalente aplicada na CliniVet',
    date: '2024-11-20',
  },
  {
    id: 'rec-2',
    petId: '1',
    type: 'consultation',
    title: 'Check-up anual',
    description: 'Exames de sangue e ultrassom - tudo normal',
    date: '2024-10-05',
  },
  {
    id: 'rec-3',
    petId: '1',
    type: 'medication',
    title: 'Vermifugo',
    description: 'Drontal Plus administrado',
    date: '2024-09-15',
  },
  {
    id: 'rec-4',
    petId: '1',
    type: 'exam',
    title: 'Hemograma completo',
    description: 'Resultados dentro da normalidade',
    date: '2024-08-01',
  },
];

const TYPE_ICONS: Record<TimelineRecord['type'], string> = {
  vaccine: '💉',
  consultation: '🩺',
  exam: '🔬',
  medication: '💊',
  note: '📝',
};

export function PetDashboard({ route }: Props) {
  const { pet } = route.params;
  const activePet = useAppStore((s) => s.activePet);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['40%', '70%'], []);

  const handleGeneratePin = useCallback(() => {
    const pin = Math.random().toString(36).substring(2, 8).toUpperCase();
    Alert.alert('PIN Gerado', `Compartilhe este PIN com o veterinário:\n\n${pin}`, [
      { text: 'Copiar', onPress: () => {} },
      { text: 'OK' },
    ]);
  }, []);

  const handleOpenSheet = useCallback(() => {
    bottomSheetRef.current?.expand();
  }, []);

  const handleCapture = useCallback(async () => {
    try {
      const result = await handleDocumentCapture(pet.id);
      Alert.alert('Sucesso', `Documento processado: ${result.id}`);
      bottomSheetRef.current?.close();
    } catch (error) {
      Alert.alert('Erro', 'Falha ao processar documento. Tente novamente.');
    }
  }, [pet.id]);

  const renderTimelineItem = ({ item }: { item: TimelineRecord }) => (
    <View style={styles.timelineItem}>
      <View style={styles.timelineDot}>
        <Text style={styles.timelineIcon}>{TYPE_ICONS[item.type]}</Text>
      </View>
      <View style={styles.timelineContent}>
        <Text style={styles.timelineDate}>{item.date}</Text>
        <Text style={styles.timelineTitle}>{item.title}</Text>
        {item.description && (
          <Text style={styles.timelineDesc}>{item.description}</Text>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Pet Info Card */}
      <View style={styles.petCard}>
        <Text style={styles.petName}>{activePet?.name ?? pet.name}</Text>
        <Text style={styles.petDetail}>
          {pet.breed} | {pet.species}
        </Text>
        {pet.birthDate && (
          <Text style={styles.petDetail}>Nascimento: {pet.birthDate}</Text>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.btnPin} onPress={handleGeneratePin}>
          <Text style={styles.btnText}>🔑 Gerar PIN</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnAdd} onPress={handleOpenSheet}>
          <Text style={styles.btnText}>+ Adicionar Registro</Text>
        </TouchableOpacity>
      </View>

      {/* Timeline */}
      <Text style={styles.sectionTitle}>Timeline</Text>
      <FlatList
        data={MOCK_TIMELINE}
        keyExtractor={(item) => item.id}
        renderItem={renderTimelineItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.timeline}
      />

      {/* Bottom Sheet - Adicionar Registro */}
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
      >
        <BottomSheetView style={styles.sheetContent}>
          <Text style={styles.sheetTitle}>Adicionar Registro</Text>

          <TouchableOpacity style={styles.sheetOption} onPress={handleCapture}>
            <Text style={styles.sheetOptionIcon}>📄</Text>
            <View>
              <Text style={styles.sheetOptionTitle}>Capturar Documento</Text>
              <Text style={styles.sheetOptionDesc}>
                Tire uma foto de um exame, receita ou atestado
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.sheetOption}>
            <Text style={styles.sheetOptionIcon}>✏️</Text>
            <View>
              <Text style={styles.sheetOptionTitle}>Nota Manual</Text>
              <Text style={styles.sheetOptionDesc}>
                Registre observações ou sintomas
              </Text>
            </View>
          </TouchableOpacity>
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  petCard: {
    backgroundColor: '#4A90D9',
    margin: 16,
    borderRadius: 16,
    padding: 20,
  },
  petName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  petDetail: {
    fontSize: 14,
    color: '#D6E4F0',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  btnPin: {
    flex: 1,
    backgroundColor: '#F0AD4E',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnAdd: {
    flex: 1,
    backgroundColor: '#5CB85C',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
  },
  timeline: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F0FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  timelineIcon: {
    fontSize: 18,
  },
  timelineContent: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  timelineDate: {
    fontSize: 12,
    color: '#999',
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A2E',
    marginTop: 2,
  },
  timelineDesc: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  sheetContent: {
    padding: 24,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 20,
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  sheetOptionIcon: {
    fontSize: 28,
  },
  sheetOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  sheetOptionDesc: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
});

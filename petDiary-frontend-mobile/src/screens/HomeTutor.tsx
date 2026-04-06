import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppStore } from '../store/useAppStore';
import type { RootStackParamList } from '../navigation/AppNavigator';
import type { Pet } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'HomeTutor'>;

// Dados simulados de pets
const MOCK_PETS: Pet[] = [
  {
    id: '1',
    name: 'Luna',
    species: 'dog',
    breed: 'Golden Retriever',
    birthDate: '2021-03-15',
    ownerId: 'user-1',
  },
  {
    id: '2',
    name: 'Milo',
    species: 'cat',
    breed: 'Siamês',
    birthDate: '2022-07-20',
    ownerId: 'user-1',
  },
  {
    id: '3',
    name: 'Kiwi',
    species: 'bird',
    breed: 'Calopsita',
    birthDate: '2023-01-10',
    ownerId: 'user-1',
  },
];

const SPECIES_EMOJI: Record<Pet['species'], string> = {
  dog: '🐕',
  cat: '🐱',
  bird: '🐦',
  other: '🐾',
};

export function HomeTutor({ navigation }: Props) {
  const setActivePet = useAppStore((s) => s.setActivePet);

  const handleSelectPet = (pet: Pet) => {
    setActivePet(pet);
    navigation.navigate('PetDashboard', { pet });
  };

  const renderPet = ({ item }: { item: Pet }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handleSelectPet(item)}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        <Text style={styles.avatarEmoji}>{SPECIES_EMOJI[item.species]}</Text>
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.petName}>{item.name}</Text>
        <Text style={styles.petBreed}>{item.breed}</Text>
        <Text style={styles.petSpecies}>{item.species}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Selecione um pet para gerenciar</Text>
      <FlatList
        data={MOCK_PETS}
        keyExtractor={(item) => item.id}
        renderItem={renderPet}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingVertical: 16,
  },
  list: {
    paddingHorizontal: 16,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 12,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E8F0FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: {
    fontSize: 28,
  },
  cardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  petName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  petBreed: {
    fontSize: 14,
    color: '#555',
    marginTop: 2,
  },
  petSpecies: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  chevron: {
    fontSize: 28,
    color: '#CCC',
    fontWeight: '300',
  },
});

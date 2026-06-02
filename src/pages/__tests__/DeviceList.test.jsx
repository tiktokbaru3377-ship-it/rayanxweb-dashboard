import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DeviceList from '../DeviceList';
import api from '../../services/api';

// Melakukan mocking pada layer network Axios API
jest.mock('../../services/api');

const mockDevicesData = {
  data: {
    devices: [
      { deviceId: 'RX-9901', deviceName: 'Logistics Tablet A', brand: 'SAMSUNG', model: 'Tab S9', androidVersion: '14', apiLevel: 34, networkType: '5G', statusOnline: true },
      { deviceId: 'RX-9902', deviceName: 'Field Handset B', brand: 'GOOGLE', model: 'Pixel 8', androidVersion: '14', apiLevel: 34, networkType: 'WIFI', statusOnline: false }
    ]
  }
};

const createTestQueryClient = () => new QueryClient({
  defaultOptions: { queries: { retry: false } }
});

describe('=== MDM Device List Matrix Integration Test Suite ===', () => {
  beforeEach(() => {
    api.get.mockResolvedValue(mockDevicesData);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('1. Harus berhasil merender data katalog perangkat dari endpoint API', async () => {
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <DeviceList />
      </QueryClientProvider>
    );

    // Memverifikasi indikator loading bekerja kemudian hilang digantikan data
    expect(screen.getByText(/Connecting to database cluster/i)).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Logistics Tablet A')).toBeInTheDocument();
      expect(screen.getByText('Field Handset B')).toBeInTheDocument();
    });
    
    expect(screen.getByText('RX-9901')).toBeInTheDocument();
  });

  test('2. Fungsi pencarian lokal harus dapat memfilter kecocokan data handset target', async () => {
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <DeviceList />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Logistics Tablet A')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Cari ID perangkat/i);
    
    // Simulasikan operator mengetik kata kunci spesifik "Pixel"
    fireEvent.change(searchInput, { target: { value: 'Pixel' } });

    // Perangkat Samsung harus tersembunyi dari layar, perangkat Google harus tetap tampil
    expect(screen.queryByText('Logistics Tablet A')).not.toBeInTheDocument();
    expect(screen.getByText('Field Handset B')).toBeInTheDocument();
  });

  test('3. Interseptor seleksi massal harus memicu panel aksi darurat (Bulk Action HUD)', async () => {
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <DeviceList />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Logistics Tablet A')).toBeInTheDocument();
    });

    // Ambil elemen checkbox global untuk memilih seluruh perangkat armada
    const selectAllCheckbox = screen.getAllByRole('checkbox')[0];
    fireEvent.click(selectAllCheckbox);

    // HUD banner pemberitahuan tindakan massal harus muncul secara interaktif
    expect(screen.getByText(/Terpilih 2 Perangkat dari hasil filter/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Wipe Session Records/i })).toBeInTheDocument();
  });
});

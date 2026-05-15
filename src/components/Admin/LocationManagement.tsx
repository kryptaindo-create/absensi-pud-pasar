import React, { useState, useEffect } from 'react';
import { 
  MapPin, Plus, Search, Trash2, Edit3, Navigation, 
  ShieldCheck, ShieldAlert, Layers, Map as MapIcon,
  Crosshair, Save, X, Info
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polygon as LeafletPolygon, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
});

export function LocationManagement() {
  const [locations, setLocations] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLoc, setEditingLoc] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    latitude: '',
    longitude: '',
    radius: '100',
    type: 'OFFICE',
    points: [{ lat: '', lng: '' }]
  });

  const mapCenter = (() => {
    const validPoint = (formData.points || []).find((p: any) => p.lat !== '' && p.lng !== '');
    if (validPoint) {
      return { lat: parseFloat(validPoint.lat), lng: parseFloat(validPoint.lng) };
    }
    return { lat: 3.5952, lng: 98.6722 };
  })();

  const polygonPath = (formData.points || [])
    .filter((p: any) => p.lat !== '' && p.lng !== '')
    .map((p: any) => ({ lat: parseFloat(p.lat), lng: parseFloat(p.lng) }));

  // Map Click Handler Component
  const MapClickHandler = ({ formData, setFormData }: any) => {
    useMapEvents({
      click: (e) => {
        const { lat, lng } = e.latlng;
        setFormData({
          ...formData,
          points: [...(formData.points || []), { lat: lat.toFixed(6), lng: lng.toFixed(6) }]
        });
      },
    });
    return null;
  };

  useEffect(() => {
    if (!auth.currentUser) return;
    const unsub = onSnapshot(collection(db, 'locations'), (snap) => {
      setLocations(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, error => handleFirestoreError(error, OperationType.GET, 'locations'));
    return unsub;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const points = (formData.points || [])
        .filter((p: any) => p.lat !== '' && p.lng !== '')
        .map((p: any) => ({ lat: parseFloat(p.lat), lng: parseFloat(p.lng) }));

      const data = {
        ...formData,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        radius: parseInt(formData.radius),
        points: points.length ? points : []
      };

      if (editingLoc) {
        await updateDoc(doc(db, 'locations', editingLoc.id), data);
      } else {
        await addDoc(collection(db, 'locations'), data);
      }
      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'locations');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', address: '', latitude: '', longitude: '', radius: '100', type: 'OFFICE', points: [{ lat: '', lng: '' }] });
    setEditingLoc(null);
  };

  const addPoint = () => {
    setFormData({ ...formData, points: [...(formData.points || []), { lat: '', lng: '' }] });
  };

  const removePoint = (index: number) => {
    const points = [...(formData.points || [])];
    points.splice(index, 1);
    setFormData({ ...formData, points });
  };

  const updatePoint = (index: number, key: 'lat' | 'lng', value: string) => {
    const points = [...(formData.points || [])];
    points[index] = { ...points[index], [key]: value };
    setFormData({ ...formData, points });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Yakin ingin menghapus lokasi ini?')) {
      try {
        await deleteDoc(doc(db, 'locations', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, 'locations');
      }
    }
  };

  return (
    <div className="space-y-8">
       {/* Header */}
       <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
           <h2 className="text-xl font-black text-slate-900 uppercase">9. Lokasi Kerja</h2>
           <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest leading-none">Manajemen Geofencing & Titik Absensi Karyawan</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all"
        >
           <Plus className="h-4 w-4" /> Tambah Lokasi
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Location List */}
         <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {locations.map((loc) => (
                 <div key={loc.id} className="bg-white rounded-[2rem] border border-slate-200 p-8 hover:shadow-xl hover:shadow-slate-200/50 transition-all group relative overflow-hidden">
                    <div className="relative z-10">
                       <div className="flex justify-between items-start mb-6">
                          <div className={`p-3 rounded-2xl ${loc.type === 'OFFICE' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                             <MapPin className="h-6 w-6" />
                          </div>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button 
                               onClick={() => {
                                 setEditingLoc(loc);
                                 setFormData({
                                   ...loc,
                                   latitude: loc.latitude?.toString() || '',
                                   longitude: loc.longitude?.toString() || '',
                                   radius: loc.radius?.toString() || '100',
                                   points: loc.points?.map((p: any) => ({ lat: p.lat?.toString() || '', lng: p.lng?.toString() || '' })) || [{ lat: '', lng: '' }]
                                 });
                                 setIsModalOpen(true);
                               }}
                               className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:text-blue-600"
                             >
                                <Edit3 className="h-4 w-4" />
                             </button>
                             <button 
                               onClick={() => handleDelete(loc.id)}
                               className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:text-red-600"
                             >
                                <Trash2 className="h-4 w-4" />
                             </button>
                          </div>
                       </div>
                       
                       <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">{loc.name}</h3>
                       <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest leading-relaxed line-clamp-1">{loc.address}</p>
                       
                       <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                          <div className="space-y-1">
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Radius Geofence</p>
                             <p className="text-xs font-black text-slate-900">{loc.radius} Meter</p>
                          </div>
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 text-green-600 border border-green-100 text-[9px] font-black uppercase tracking-widest">
                             <ShieldCheck className="h-3 w-3" /> Aktif
                          </div>
                       </div>
                    </div>
                    {/* Background ID Watermark */}
                    <span className="absolute -right-4 -bottom-4 text-7xl font-black text-slate-50 select-none pointer-events-none group-hover:text-slate-100/50 transition-colors">
                       {loc.name[0].toUpperCase()}
                    </span>
                 </div>
               ))}

               {locations.length === 0 && (
                 <div className="col-span-full py-20 text-center bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-200">
                    <Navigation className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Belum Ada Lokasi Terdaftar</p>
                 </div>
               )}
            </div>
         </div>

         {/* Sidebar Info */}
         <div className="space-y-8">
            <div className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden group">
               <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-8">
                     <Layers className="h-5 w-5 text-blue-400" />
                     <h3 className="text-xs font-black uppercase tracking-widest text-slate-300">Statistik Geofencing</h3>
                  </div>
                  <div className="space-y-8">
                     <div>
                        <p className="text-2xl font-black tracking-tight">{locations.length}</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Total Lokasi Terdaftar</p>
                     </div>
                     <div className="space-y-4 pt-8 border-t border-white/5">
                        <div className="flex items-start gap-3">
                           <ShieldAlert className="h-4 w-4 text-amber-500 mt-0.5" />
                           <p className="text-[10px] text-slate-400 leading-relaxed uppercase font-medium">
                              Gunakan radius 100m - 200m untuk hasil akurasi GPS terbaik di area pasar yang padat.
                           </p>
                        </div>
                     </div>
                  </div>
               </div>
               <MapIcon className="absolute -right-8 -bottom-8 h-40 w-40 text-white/5 rotate-12 group-hover:scale-110 transition-transform" />
            </div>

            <div className="bg-blue-600 rounded-[2rem] p-8 text-white shadow-xl shadow-blue-200 group cursor-pointer overflow-hidden relative">
               <div className="relative z-10">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4">Lacak Online</h4>
                  <p className="text-2xl font-black tracking-tight uppercase">Live Tracking</p>
                  <p className="text-[9px] font-bold text-blue-100 mt-2 uppercase tracking-widest">Pantau lokasi pegawai secara real-time</p>
               </div>
               <Crosshair className="absolute -right-6 -bottom-6 h-32 w-32 text-white/10 group-hover:scale-110 transition-transform animate-pulse" />
            </div>
         </div>
      </div>

      {/* Location Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden"
             >
                <form onSubmit={handleSubmit} className="p-10 space-y-8">
                   <div className="flex justify-between items-center">
                      <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">{editingLoc ? 'Edit Lokasi' : 'Tambah Lokasi Baru'}</h3>
                      <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-300 hover:text-slate-600 transition-colors">
                         <X className="h-7 w-7" />
                      </button>
                   </div>

                   <div className="space-y-6">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Lokasi / Unit</label>
                         <input 
                           required
                           className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 px-6 text-xs font-bold focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
                           placeholder="Contoh: Unit Pasar Petisah"
                           value={formData.name}
                           onChange={e => setFormData({...formData, name: e.target.value})}
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Alamat Lengkap</label>
                         <textarea 
                           required
                           className="w-full h-24 rounded-2xl border border-slate-200 bg-slate-50 py-4 px-6 text-xs font-bold resize-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
                           placeholder="Jl. Razak No. 1, Medan"
                           value={formData.address}
                           onChange={e => setFormData({...formData, address: e.target.value})}
                         />
                      </div>

                      <div className="space-y-4 pt-4 border-t border-slate-100">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Area Bangunan</p>
                            <p className="text-[9px] text-slate-500 mt-1">Klik peta untuk menambahkan titik sudut area bangunan. Titik minimal 3 untuk polygon.</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, points: [{ lat: '', lng: '' }] })}
                            className="text-[9px] font-bold uppercase text-blue-600 hover:underline"
                          >
                            Reset Area
                          </button>
                        </div>
                        {hasMapKey ? (
                          <div className="h-72 rounded-[2rem] overflow-hidden border border-slate-200">
                            <MapContainer 
                              center={[mapCenter.lat, mapCenter.lng]}
                              zoom={17}
                              style={{ width: '100%', height: '100%' }}
                              className="leaflet-container"
                            >
                              <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                              />
                              
                              {/* Polygon dari points */}
                              {polygonPath.length >= 3 && (
                                <LeafletPolygon 
                                  positions={polygonPath.map((p: any) => [p.lat, p.lng])}
                                  color="#2563eb"
                                  fillColor="#2563eb"
                                  fillOpacity={0.18}
                                  weight={3}
                                />
                              )}
                              
                              {/* Markers untuk setiap point */}
                              {polygonPath.map((point: any, index: number) => (
                                <Marker
                                  key={`point-${index}`}
                                  position={[point.lat, point.lng]}
                                  icon={L.icon({
                                    iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCAzMiA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzIiIGhlaWdodD0iNDgiIHJ4PSI4IiBmaWxsPSIjMjU2M2ViIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPnt7aW5kZXh9fTwvdGV4dD48L3N2Zz4='.replace('{{index}}', (index+1).toString()),
                                    iconSize: [32, 48],
                                    iconAnchor: [16, 48],
                                    popupAnchor: [0, -48]
                                  })}
                                >
                                  <Popup>
                                    <div className="text-xs">
                                      <p className="font-bold">Titik {index + 1}</p>
                                      <p className="text-[10px] text-slate-500">{point.lat.toFixed(6)}, {point.lng.toFixed(6)}</p>
                                    </div>
                                  </Popup>
                                </Marker>
                              ))}
                              
                              <MapClickHandler formData={formData} setFormData={setFormData} />
                            </MapContainer>
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                            Map tidak tersedia. Pastikan browser Anda support Leaflet.
                          </div>
                        )}

                        <div className="space-y-4">
                          {(formData.points || []).map((point: any, index: number) => (
                            <div key={index} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 items-end">
                              <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Latitude titik {index + 1}</label>
                                <input
                                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 px-4 text-xs font-bold"
                                  placeholder="Latitude"
                                  value={point.lat}
                                  onChange={e => updatePoint(index, 'lat', e.target.value)}
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Longitude titik {index + 1}</label>
                                <input
                                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 px-4 text-xs font-bold"
                                  placeholder="Longitude"
                                  value={point.lng}
                                  onChange={e => updatePoint(index, 'lng', e.target.value)}
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => removePoint(index)}
                                className="h-12 w-12 rounded-2xl bg-slate-100 text-slate-500 hover:text-red-600 transition-colors"
                                title="Hapus titik"
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest">Masukkan titik-titik batas area sesuai bentuk bangunannya. Titik minimal 3 untuk polygon.</p>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                         <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Latitude</label>
                           <input 
                             required={polygonPath.length === 0}
                             className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 px-6 text-xs font-bold"
                             placeholder="3.5952"
                             value={formData.latitude}
                             onChange={e => setFormData({...formData, latitude: e.target.value})}
                           />
                         </div>
                         <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Longitude</label>
                           <input 
                             required={polygonPath.length === 0}
                             className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 px-6 text-xs font-bold"
                             placeholder="98.6722"
                             value={formData.longitude}
                             onChange={e => setFormData({...formData, longitude: e.target.value})}
                           />
                         </div>
                      </div>

                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Radius Geofence (Meter)</label>
                         <div className="flex items-center gap-4">
                            <input 
                              type="range"
                              min="50"
                              max="1000"
                              step="50"
                              className="flex-1 accent-blue-600"
                              value={formData.radius}
                              onChange={e => setFormData({...formData, radius: e.target.value})}
                            />
                            <span className="w-20 text-center rounded-xl bg-blue-50 py-2 text-xs font-black text-blue-600 border border-blue-100">{formData.radius}m</span>
                         </div>
                      </div>
                   </div>

                   <button className="w-full rounded-[1.5rem] bg-slate-900 py-5 text-xs font-black uppercase text-white shadow-2xl shadow-slate-200 hover:bg-slate-800 transition-all flex items-center justify-center gap-3">
                      <Save className="h-5 w-5" /> Simpan Konfigurasi
                   </button>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

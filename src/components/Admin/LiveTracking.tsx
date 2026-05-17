import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { MapPin, Navigation, User, Signal, History, Info, ChevronRight, Plus, X, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
});

export function LiveTracking() {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [geofences, setGeofences] = useState<any[]>([]);
  const [showAddGeofence, setShowAddGeofence] = useState(false);
  const [newGeofence, setNewGeofence] = useState({ name: '', lat: '3.5952', lng: '98.6722', radius: '500' });
  const [mapClickPos, setMapClickPos] = useState<[number, number] | null>(null);

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, error => handleFirestoreError(error, OperationType.GET, 'users'));
    
    const unsubGeofences = onSnapshot(collection(db, 'geofences'), (snap) => {
      setGeofences(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, error => handleFirestoreError(error, OperationType.GET, 'geofences'));
    
    return () => {
      unsubUsers();
      unsubGeofences();
    };
  }, []);

  const handleAddGeofence = async () => {
    if (!newGeofence.name.trim() || !newGeofence.lat || !newGeofence.lng || !newGeofence.radius) {
      alert('Lengkapi semua field!');
      return;
    }

    try {
      await addDoc(collection(db, 'geofences'), {
        name: newGeofence.name,
        latitude: parseFloat(newGeofence.lat),
        longitude: parseFloat(newGeofence.lng),
        radiusMeters: parseFloat(newGeofence.radius),
        createdAt: serverTimestamp(),
        isActive: true
      });
      
      setNewGeofence({ name: '', lat: '3.5952', lng: '98.6722', radius: '500' });
      setShowAddGeofence(false);
      setMapClickPos(null);
    } catch (error) {
      handleFirestoreError(error as Error, OperationType.CREATE, 'geofences');
    }
  };

  // Demo locations if not present in DB
  const employeeLocations = users.map(u => ({
    ...u,
    lat: u.lastLat || 3.5952 + (Math.random() - 0.5) * 0.01,
    lng: u.lastLng || 98.6722 + (Math.random() - 0.5) * 0.01
  }));

  const MapClickHandler = () => {
    useMapEvents({
      click: (e) => {
        if (showAddGeofence) {
          const { lat, lng } = e.latlng;
          setMapClickPos([lat, lng]);
          setNewGeofence(prev => ({
            ...prev,
            lat: lat.toFixed(6),
            lng: lng.toFixed(6)
          }));
        }
      },
    });
    return null;
  };

  return (
    <div className="h-[calc(100vh-140px)] flex gap-8">
       {/* Left side: Map Area */}
       <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden relative group">
          <MapContainer 
            center={[3.5952, 98.6722]} 
            zoom={14} 
            style={{ width: '100%', height: '100%' }}
            className="leaflet-container"
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            
            {/* Geofence Circles */}
            {geofences.map(gf => (
              <Circle
                key={gf.id}
                center={[gf.latitude, gf.longitude]}
                radius={gf.radiusMeters}
                pathOptions={{
                  color: '#2563eb',
                  fill: true,
                  fillColor: '#2563eb',
                  fillOpacity: 0.1,
                  weight: 2,
                  dashArray: '5, 5'
                }}
              >
                <Popup>
                  <div className="text-xs font-bold">
                    <p className="text-blue-600">{gf.name}</p>
                    <p className="text-slate-500 text-[10px]">Radius: {gf.radiusMeters}m</p>
                    <p className="text-slate-400 text-[9px] mt-1">
                      {gf.latitude.toFixed(4)}, {gf.longitude.toFixed(4)}
                    </p>
                  </div>
                </Popup>
              </Circle>
            ))}

            {/* Click Position Indicator */}
            {mapClickPos && (
              <Marker
                position={mapClickPos}
                icon={L.icon({
                  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSI4IiBmaWxsPSIjZjU5ZTBiIiBzdHJva2U9IiNlYzcwNjMiIHN0cm9rZS13aWR0aD0iMiIvPjwvc3ZnPg==',
                  iconSize: [24, 24],
                  iconAnchor: [12, 12],
                })}
              />
            )}

            {/* Employee Markers */}
            {employeeLocations.map(u => (
              <Marker
                key={u.id}
                position={[u.lat, u.lng]}
                icon={L.icon({
                  iconUrl: u.outsideGeofence 
                    ? 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCAzMiA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzIiIGhlaWdodD0iNDgiIHJ4PSI4IiBmaWxsPSIjZWY0NDQ0Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkk8L3RleHQ+PC9zdmc+'
                    : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCAzMiA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzIiIGhlaWdodD0iNDgiIHJ4PSI4IiBmaWxsPSIjMjU2M2ViIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkk8L3RleHQ+PC9zdmc+',
                  iconSize: [32, 48],
                  iconAnchor: [16, 48],
                  popupAnchor: [0, -48]
                })}
              >
                <Popup>
                  <div className="text-xs font-bold">
                    <p className="text-slate-900">{u.name}</p>
                    <p className="text-slate-500 text-[10px]">{u.jabatan}</p>
                    <p className={`text-[10px] font-bold mt-1 ${u.outsideGeofence ? 'text-red-600' : 'text-green-600'}`}>
                      {u.outsideGeofence ? 'Outside Geofence' : 'In Area'}
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}

            <MapClickHandler />
          </MapContainer>

          {/* Map Overlay Stats */}
          <div className="absolute top-6 left-6 p-4 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200 shadow-xl flex items-center gap-4">
             <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Live Traffic</span>
             </div>
             <div className="h-4 w-[1px] bg-slate-200" />
             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pegawai Online: {users.length}</p>
          </div>

          {/* Add Geofence Button */}
          <button
            onClick={() => setShowAddGeofence(!showAddGeofence)}
            className="absolute bottom-6 right-6 p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-xl transition-all"
            title="Click di map untuk set lokasi, atau isi manual"
          >
            <Plus className="h-5 w-5" />
          </button>
       </div>

       {/* Right side: Employee List / Geofence Management */}
       <div className="w-96 flex flex-col gap-6">
          <div className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden shrink-0">
             <div className="relative z-10">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-6">Navigasi Unit</h3>
                <div className="space-y-4">
                   <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center gap-3">
                         <Signal className="h-4 w-4 text-blue-400" />
                         <span className="text-[11px] font-bold uppercase text-slate-300">Stabilitas GPS</span>
                      </div>
                      <span className="text-[10px] font-black text-green-500">EXCELLENT</span>
                   </div>
                </div>
             </div>
             <Navigation className="absolute -right-6 -bottom-6 h-32 w-32 text-white/5 rotate-12" />
          </div>

          {/* Tabs for Employee & Geofence */}
          <div className="flex-1 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
             <div className="flex border-b border-slate-100 bg-slate-50/30">
                <button
                  onClick={() => setShowAddGeofence(false)}
                  className={`flex-1 p-4 text-[10px] font-black uppercase tracking-[0.1em] transition-colors ${
                    !showAddGeofence ? 'bg-white text-slate-900 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  👥 Pegawai ({users.length})
                </button>
                <button
                  onClick={() => setShowAddGeofence(true)}
                  className={`flex-1 p-4 text-[10px] font-black uppercase tracking-[0.1em] transition-colors ${
                    showAddGeofence ? 'bg-white text-slate-900 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  🗺️ Lokasi ({geofences.length})
                </button>
             </div>

             {/* Employee List Tab */}
             {!showAddGeofence && (
               <>
                 <div className="flex-1 overflow-y-auto divide-y divide-slate-50 scrollbar-hide">
                    {employeeLocations.map(u => (
                      <div 
                        key={u.id}
                        onClick={() => setSelectedUser(u)}
                        className={`p-5 flex items-center justify-between cursor-pointer transition-all hover:bg-slate-50 ${selectedUser?.id === u.id ? 'bg-blue-50/50' : ''}`}
                      >
                         <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-black text-slate-300 text-[10px] uppercase">
                               {u.name?.[0]}
                            </div>
                            <div>
                               <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{u.name}</p>
                               <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase truncate max-w-[120px]">{u.jabatan || 'STAFF'}</p>
                            </div>
                         </div>
                         <div className="text-right">
                            <div className={`h-2 w-2 rounded-full ml-auto ${u.outsideGeofence ? 'bg-red-500' : 'bg-green-500'}`} />
                            <p className="text-[8px] font-black uppercase text-slate-300 mt-1.5">{u.outsideGeofence ? 'Outside' : 'In Area'}</p>
                         </div>
                      </div>
                    ))}
                 </div>
                 
                 <AnimatePresence>
                    {selectedUser && (
                      <motion.div 
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        className="p-6 bg-slate-50 border-t border-slate-100 space-y-4"
                      >
                         <div className="flex justify-between items-center">
                            <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Detail Perangkat</p>
                            <button onClick={() => setSelectedUser(null)} className="text-slate-400 hover:text-red-500"><X className="h-4 w-4" /></button>
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 rounded-xl bg-white border border-slate-200">
                               <p className="text-[8px] font-bold text-slate-400 uppercase">Provider</p>
                               <p className="text-[10px] font-black text-slate-900 mt-0.5">TELKOMSEL</p>
                            </div>
                            <div className="p-3 rounded-xl bg-white border border-slate-200">
                               <p className="text-[8px] font-bold text-slate-400 uppercase">Akurasi</p>
                               <p className="text-[10px] font-black text-slate-900 mt-0.5">± 5 Meter</p>
                            </div>
                         </div>
                         <button className="w-full py-3 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl shadow-slate-200 flex items-center justify-center gap-2">
                            <History className="h-3 w-3" /> Lihat Rekap Perjalanan
                         </button>
                      </motion.div>
                    )}
                 </AnimatePresence>
               </>
             )}

             {/* Geofence Management Tab */}
             {showAddGeofence && (
               <>
                 {/* Geofence List */}
                 <div className="flex-1 overflow-y-auto scrollbar-hide">
                    {geofences.length === 0 ? (
                      <div className="p-8 text-center text-slate-400">
                        <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-[10px] font-bold">Belum ada lokasi</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-50 p-4 space-y-3">
                         {geofences.map(gf => (
                           <div key={gf.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                              <p className="text-xs font-black text-slate-900 uppercase">{gf.name}</p>
                              <p className="text-[9px] text-slate-500 mt-2">
                                📍 {gf.latitude.toFixed(4)}, {gf.longitude.toFixed(4)}
                              </p>
                              <p className="text-[9px] text-slate-500">📏 Radius: {gf.radiusMeters}m</p>
                           </div>
                         ))}
                      </div>
                    )}
                 </div>

                 {/* Add Geofence Form */}
                 <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-3">
                    <div>
                      <label className="text-[8px] font-black text-slate-400 uppercase">Nama Lokasi</label>
                      <input
                        type="text"
                        value={newGeofence.name}
                        onChange={(e) => setNewGeofence(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Kantor, Lapangan, dll"
                        className="w-full mt-1 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[8px] font-black text-slate-400 uppercase">Latitude</label>
                        <input
                          type="number"
                          step="0.0001"
                          value={newGeofence.lat}
                          onChange={(e) => setNewGeofence(prev => ({ ...prev, lat: e.target.value }))}
                          className="w-full mt-1 px-2 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-[8px] font-black text-slate-400 uppercase">Longitude</label>
                        <input
                          type="number"
                          step="0.0001"
                          value={newGeofence.lng}
                          onChange={(e) => setNewGeofence(prev => ({ ...prev, lng: e.target.value }))}
                          className="w-full mt-1 px-2 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[8px] font-black text-slate-400 uppercase">Radius (meter)</label>
                      <input
                        type="number"
                        value={newGeofence.radius}
                        onChange={(e) => setNewGeofence(prev => ({ ...prev, radius: e.target.value }))}
                        placeholder="500"
                        className="w-full mt-1 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <p className="text-[8px] text-slate-500 italic">
                      💡 Tip: Klik di map untuk auto-set koordinat
                    </p>

                    <button
                      onClick={handleAddGeofence}
                      className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Save className="h-3 w-3" /> Simpan Lokasi
                    </button>
                 </div>
               </>
             )}
          </div>
       </div>
    </div>
  );
}

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { MapPin, Navigation, User, Signal, History, Info, ChevronRight, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, error => handleFirestoreError(error, OperationType.GET, 'users'));
    return unsub;
  }, []);

  // Demo locations if not present in DB
  const employeeLocations = users.map(u => ({
    ...u,
    lat: u.lastLat || 3.5952 + (Math.random() - 0.5) * 0.01,
    lng: u.lastLng || 98.6722 + (Math.random() - 0.5) * 0.01
  }));

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
       </div>

       {/* Right side: Employee List / Detail */}
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

          <div className="flex-1 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
             <div className="p-6 border-b border-slate-100 bg-slate-50/30">
                <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Monitoring Pegawai</h3>
             </div>
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
                        <button onClick={() => setSelectedUser(null)} className="text-slate-400 hover:text-red-500"><Plus className="h-4 w-4 rotate-45" /></button>
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
          </div>
       </div>
    </div>
  );
}

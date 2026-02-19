/** Authentication context provider for customer app. */
import React, { createContext, useContext } from 'react';
import { useSession } from '../state/useSession';
const Ctx=createContext(null);
export function AuthProvider({children}){ const session=useSession(); return <Ctx.Provider value={session}>{children}</Ctx.Provider>; }
export const useAuth = ()=>useContext(Ctx);

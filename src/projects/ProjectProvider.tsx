import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useFloorDesign } from '../layout/useFloorDesign';
import { createProjectRepository } from './repository';
import { createProjectRuntime } from './runtime';
import { indexedProjectStorage } from './storage';
import { ProjectContext } from './context';
export function ProjectProvider({children}:{children:ReactNode}){
  const {restoreProject}=useFloorDesign();
  const restore=useRef(restoreProject);restore.current=restoreProject;
  const [repository]=useState(()=>createProjectRepository(indexedProjectStorage(),createProjectRuntime(prepared=>restore.current(prepared))));
  useEffect(()=>{void repository.hydrate();return ()=>repository.dispose();},[repository]);
  return <ProjectContext.Provider value={repository}>{children}</ProjectContext.Provider>;
}

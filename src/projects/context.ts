import { createContext, useContext } from 'react';
import type { ProjectRepository } from './repository';
export const ProjectContext=createContext<ProjectRepository|null>(null);
export function useProjects(){const value=useContext(ProjectContext);if(!value)throw Error('Project provider is missing.');return value;}

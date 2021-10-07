import {matchPath} from 'react-router-dom';
import { ROUTES } from './constants';

export const parseRoutes = (context: any) => {
  for (const [, v] of Object.entries(ROUTES)) {
    const object:any = v;
    if (typeof object === "string") {
      // scan: '/scan/:account'
      const {match, newContext} = checkRoute(object, context);
      if (match) return newContext;
    } else if (Object.keys(object).includes('path')) {
      /*
        templateForm: {
          path: '/admin/template/form/:id?',
          roles: [ROLES.eventHost],
        }
      */
      const {match, newContext} = checkRoute(object.path, context);
      if (match) return newContext;
    } else if (Object.keys(object).includes('main')) {
      /*
      checkouts: {
        main: '/e/:fancyId', Check for this var
        admin: {
          path: '/admin/checkouts',
          roles: [ROLES.administrator],
          title: 'Checkouts',
        },
      }
      */
      const {match, newContext} = checkRoute(object.main, context);
      if(match) {
        return newContext;
      } else {
        for (const [, value] of Object.entries(object)) {
          /*
            Iterating in the objects inside
          */
          if (typeof value === "string") {
            // scan: '/scan/:account'
            const {match, newContext} = checkRoute(value, context);
            if (match) return newContext;
          } else {
            /*
              templateForm: {
                path: '/admin/template/form/:id?',
                roles: [ROLES.eventHost],
              }
            */
            const object1:any = value;
            const {match, newContext} = checkRoute(object1.path, context);
            if (match) return newContext;
          }
        }
      }
    } else {
      for (const [, value] of Object.entries(object)) {
        /*
          templateForm: {
            path: '/admin/template/form/:id?',
            roles: [ROLES.eventHost],
          }
        */
        const object1:any = value;
        const {match, newContext} = checkRoute(object1.path, context);
        if (match) return newContext;
      }
    }
  }
  return context;
};

const checkRoute = (route:string, context: any) => {
  const match = matchPath(context.name, {
    path: route,
    exact: true,
    strict: false
  })

  return {
    match,
    newContext: {...context, name: route}
  }
}
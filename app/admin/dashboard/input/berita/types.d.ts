declare module "./styles.css" { 
  const content: Record<string, string>; 
  export default content; 
} 
 
declare module "quill/dist/quill.snow.css" {} 
 
// eslint-disable-next-line @typescript-eslint/no-explicit-any 
declare module "quill" { 
  interface Quill { 
    root: { innerHTML: string }; 
  } 
}

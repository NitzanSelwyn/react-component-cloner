/**
 * Fiber Utils - React Fiber inspection and manipulation utilities
 * @module fiber-utils
 */

// Fiber Accessor
export {
  getFiberFromElement,
  getElementFromFiber,
  findRootFiber,
  getNearestComponentFiber,
  isComponentFiber,
  isHostFiber,
  getComponentName,
  getFiberTagName,
  hasReactDevTools,
  getReactVersion,
  findAllFiberRoots,
} from './fiber-accessor';

// Fiber Traversal
export {
  traverseFiberTree,
  getChildrenFibers,
  getParentFiber,
  getAncestorFibers,
  getComponentPath,
  findFiber,
  findAllFibers,
  getSiblingFibers,
  getFiberDepth,
  countDescendants,
  findNearestHostFiber,
  findAllHostFibers,
  isAncestorOf,
  findCommonAncestor,
} from './fiber-traversal';

// Component Identifier
export {
  identifyComponentType,
  isFunctionComponent,
  isClassComponent,
  isMemoComponent,
  isForwardRefComponent,
  isContextProvider,
  isContextConsumer,
  isFragment,
  isHostComponent,
  isTextNode,
  usesHooks,
  getUnwrappedType,
  isNativeElement,
  getComponentTypeInfo,
  isCustomComponent,
  isLikelyThirdPartyComponent,
} from './component-identifier';

// Metadata Extractor
export {
  extractProps,
  extractChildrenFromProps,
  extractState,
  extractContextValues,
  extractRef,
  extractKey,
  extractSourceLocation,
  extractOwner,
  buildComponentInfo,
  extractAllMetadata,
  hasProps,
  hasChildren,
  countChildren,
} from './metadata-extractor';

// Hooks Extractor
export {
  extractHooks,
  extractStateHooks,
  extractEffectHooks,
  extractRefHooks,
  extractContextHooks,
  countHooksByType,
  getHooksSummary,
  usesHookType,
  extractStateInitialValues,
} from './hooks-extractor';

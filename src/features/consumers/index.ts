// API publique de la feature consumers (utilisateurs des applications) : seul point d'import extérieur.
export { ConsumerDetailsDialog } from "./components/ConsumerDetailsDialog";
export { ConsumersTable, type ConsumerAction } from "./components/ConsumersTable";
export { useConsumerActions } from "./hooks/useConsumerActions";
export { CONSUMERS_PAGE_SIZE, useConsumers } from "./hooks/useConsumers";

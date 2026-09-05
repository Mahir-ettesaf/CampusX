import AnnouncementDetailsScreen from "../common/AnnouncementDetailsScreen";

export default function AdminAnnouncementDetailsScreen() {
  return <AnnouncementDetailsScreen managementRole="admin" listRoute="AdminAnnouncements" editRoute="AdminEditAnnouncement" />;
}

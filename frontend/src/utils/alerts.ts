import Swal from "sweetalert2";

const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3500,
  timerProgressBar: true,
});

export function notifySuccess(message: string) {
  void Toast.fire({ icon: "success", title: message });
}

export function notifyError(message: string) {
  void Toast.fire({ icon: "error", title: message });
}

export function notifyInfo(message: string) {
  void Toast.fire({ icon: "info", title: message });
}

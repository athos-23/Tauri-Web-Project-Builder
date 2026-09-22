#![cfg_attr(
    not(debug_assertions),
    windows_subsystem = "windows"
)]

fn main() {

    web_project_builder_lib::run();

}

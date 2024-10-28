fn parse_number_form_string(s: &str) -> Option<i32> {
    match s.parse::<i32>() {
        Ok(r) => Some(r),
        Err(_) => None,
    }
}

fn main() {
    let s = "hello, world!";
    println!("{:?}", parse_number_form_string(s));
    println!("{:?}", parse_number_form_string("123"))
}
